import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import type { SegmentEvent } from '@segment/actions-core'
import GoogleEnhancedConversions from '../../index'
import { API_VERSION } from '../../functions'

export const testDestination = createTestIntegration(GoogleEnhancedConversions)
export const customerId = '1234'
export const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()

// CRM_ID mapping keeps the outbound identifier (thirdPartyUserId) equal to the event's userId, so the
// per-payload `sent` operation is easy to assert exactly.
export const mapping = {
  crm_id: { '@path': '$.userId' },
  event_name: { '@path': '$.event' },
  ad_user_data_consent_state: 'GRANTED',
  ad_personalization_consent_state: 'GRANTED',
  external_audience_id: '1234',
  retlOnMappingSave: {
    outputs: {
      id: '1234',
      name: 'Test List',
      external_id_type: 'CRM_ID'
    }
  }
}

export const FLAG_ON = { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true }

// Each flag case: `features` is spread into the action input (undefined => flag off).
export const flagCases = [
  { name: 'flag OFF', features: undefined as Record<string, boolean> | undefined },
  { name: 'flag ON', features: FLAG_ON as Record<string, boolean> | undefined }
]

const CREATE_JOB_URL = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`
const ADD_OPS_URL = `https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`
const RUN_JOB_URL = `https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`

/** Mocks the three offline-user-data-job calls for the single-event (perform) path. */
export function setupNocksForPerform(): void {
  nock(CREATE_JOB_URL).post(/.*/).reply(200, { data: 'offlineDataJob' })
  nock(ADD_OPS_URL).post(/.*/).reply(200, { data: 'offlineDataJob' })
  nock(RUN_JOB_URL).post(/.*/).reply(200, { data: 'offlineDataJob' })
}

/**
 * Mocks the job calls for the batch (performBatch) path. `addOperationsCalls` is how many
 * addOperations requests to expect (1 for all-add or all-remove batches, 2 when a batch contains
 * both adds and removes — they are sent as separate calls).
 */
export function setupNocksForBatch(addOperationsCalls = 1): void {
  nock(CREATE_JOB_URL).post(/.*/).reply(200, { resourceName: 'customers/1234/userLists/1234' })
  nock(ADD_OPS_URL).post(/.*/).times(addOperationsCalls).reply(200, {})
  nock(RUN_JOB_URL).post(/.*/).reply(200, { done: true })
}

/**
 * Mocks the batch path where Google reports a partial failure for the operation at `failedOpIndex`
 * within the CREATE operations array. When the batch also contains removes (`hasRemoves`, the
 * default), the separate REMOVE operations call succeeds. For all-add batches (e.g. Journeys V1)
 * there is only one addOperations call, so pass `hasRemoves = false`.
 */
export function setupNocksForBatchPartialFailure(failedOpIndex = 0, hasRemoves = true): void {
  nock(CREATE_JOB_URL).post(/.*/).reply(200, { resourceName: 'customers/1234/userLists/1234' })
  nock(ADD_OPS_URL)
    .post(/.*/, (body: { operations: Array<Record<string, unknown>> }) => body.operations.some((op) => 'create' in op))
    .reply(200, {
      partialFailureError: {
        code: 3,
        message: 'partial failure',
        details: [
          {
            '@type': 'type.googleapis.com/google.ads.googleads.v21.errors.GoogleAdsFailure',
            errors: [
              {
                errorCode: { offlineUserDataJobError: 'INVALID_SHA256_FORMAT' },
                message: 'The SHA256 encoded value is malformed.',
                location: { fieldPathElements: [{ fieldName: 'operations', index: failedOpIndex }] }
              }
            ]
          }
        ]
      }
    })
  if (hasRemoves) {
    nock(ADD_OPS_URL)
      .post(/.*/, (body: { operations: Array<Record<string, unknown>> }) => body.operations.some((op) => 'remove' in op))
      .reply(200, {})
  }
  nock(RUN_JOB_URL).post(/.*/).reply(200, { done: true })
}

/**
 * Journeys V1 event: always uses the "Audience Entered" event name and never carries
 * properties[computation_key]. Such events always ADD (V1 has no remove path).
 */
export function createJourneyV1Event(userId: string): SegmentEvent {
  return createTestEvent({
    timestamp,
    type: 'track',
    userId,
    event: 'Audience Entered',
    properties: {
      journey_context: { my_audience: {} },
      journey_metadata: { journey_id: 'jver_1', journey_name: 'journey1' }
    },
    context: {
      personas: {
        computation_id: 'journey_123',
        computation_key: 'my_audience',
        computation_class: 'journey_step',
        namespace: 'spa_abc'
      }
    }
  })
}

/**
 * Journeys V2 event: a journey_step event carrying the membership boolean
 * properties[computation_key] (true => add, false => remove). Only sent with the flag on.
 */
export function createJourneyV2Event(userId: string | undefined, membership: boolean | undefined): SegmentEvent {
  const properties: Record<string, unknown> = {
    journey_context: { my_audience: {} },
    journey_metadata: { journey_id: 'jver_1', journey_name: 'journey1' }
  }
  if (typeof membership === 'boolean') properties.my_audience = membership
  return createTestEvent({
    timestamp,
    type: 'track',
    userId,
    event: 'Journeys V2 Step Transition',
    properties,
    context: {
      personas: {
        computation_id: 'journey_123',
        computation_key: 'my_audience',
        computation_class: 'journey_step',
        namespace: 'spa_abc'
      }
    }
  })
}

/**
 * Engage (audience) event. Add/remove is driven by the event name "Audience Entered"/"Audience
 * Exited" (and, when the flag is on, also by the membership boolean) — independent of the flag.
 */
export function createEngageEvent(
  userId: string | undefined,
  action: 'add' | 'remove',
  membership?: boolean
): SegmentEvent {
  const properties: Record<string, unknown> = {}
  if (typeof membership === 'boolean') properties.my_audience = membership
  return createTestEvent({
    timestamp,
    type: 'track',
    userId,
    event: action === 'add' ? 'Audience Entered' : 'Audience Exited',
    properties,
    context: {
      personas: {
        computation_id: 'aud_123',
        computation_key: 'my_audience',
        computation_class: 'audience',
        namespace: 'spa_abc'
      }
    }
  })
}

export const createOperation = (thirdPartyUserId: string) => ({ create: { userIdentifiers: { thirdPartyUserId } } })
export const removeOperation = (thirdPartyUserId: string) => ({ remove: { userIdentifiers: { thirdPartyUserId } } })

/** Full multi-status node for a successful batch operation. */
export const successNode = (operation: Record<string, unknown>) => ({
  status: 200,
  sent: operation,
  body: { done: true }
})

/** Full multi-status node for a payload that failed client-side validation (missing identifier). */
export const validationErrorNode = () => ({
  status: 400,
  errortype: 'PAYLOAD_VALIDATION_FAILED',
  errormessage: 'Missing or Invalid data for CRM_ID.',
  errorreporter: 'INTEGRATIONS'
})

/** Full multi-status node for an operation Google rejected via partial failure. */
export const partialFailureNode = (operation: Record<string, unknown>) => ({
  status: 400,
  errortype: 'BAD_REQUEST',
  errormessage: 'The SHA256 encoded value is malformed.',
  sent: operation,
  body: {
    errorCode: { offlineUserDataJobError: 'INVALID_SHA256_FORMAT' },
    message: 'The SHA256 encoded value is malformed.',
    location: { fieldPathElements: [{ fieldName: 'operations', index: 0 }] }
  },
  errorreporter: 'DESTINATION'
})
