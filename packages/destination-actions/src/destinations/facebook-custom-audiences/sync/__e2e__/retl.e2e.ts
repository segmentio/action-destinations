import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2ERetlAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_retl'
const COMPUTATION_ID = 'aud_e2e_facebook_retl_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Note: the `sent` object also includes `audienceId`, but we intentionally do not assert it here.
// It resolves to the audience created during the e2e run (a different id each run), and the runner
// does not substitute the $externalAudienceId marker inside expectations — so there is no stable
// value to assert. We assert the operation (method) and the hashed identifier row instead.
const fixtures: E2EFixture[] = [
  {
    description: 'RETL: single entity added (track "new" event)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'add'
    },
    mode: 'single',
    event: createE2ERetlAudienceEvent({
      eventName: 'new',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-retl-user-001',
      email: 'e2e-fb-retl-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: single entity removed (track "deleted" event)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'delete'
    },
    mode: 'single',
    event: createE2ERetlAudienceEvent({
      eventName: 'deleted',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-retl-user-002',
      email: 'e2e-fb-retl-002@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: batch entity added (syncMode=mirror, "new" events)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-003',
        email: 'e2e-fb-retl-003@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-004',
        email: 'e2e-fb-retl-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // Both "new" events are adds => POST. data is the Facebook schema row (externalId is index 0,
      // unhashed; remaining identifier slots empty as only externalId is set).
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-retl-user-003', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-retl-user-004', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: batch entity removed (syncMode=mirror, "deleted" events)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-005',
        email: 'e2e-fb-retl-005@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-006',
        email: 'e2e-fb-retl-006@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // Both "deleted" events are removes => DELETE.
      jsonContains: [
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-retl-user-005', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-retl-user-006', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: batch mixed add and remove (syncMode=mirror, "new" + "deleted" events)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-007',
        email: 'e2e-fb-retl-007@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-008',
        email: 'e2e-fb-retl-008@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-003',
        email: 'e2e-fb-retl-003@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-004',
        email: 'e2e-fb-retl-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // Indexes 0,1 are "new" (adds => POST); indexes 2,3 are "deleted" (removes => DELETE).
      // Per-index sent operation must stay aligned with the original payload order.
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-retl-user-007', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-retl-user-008', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-retl-user-003', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-retl-user-004', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Batch mixing a valid add ("new"), a valid remove ("deleted") and a schema-invalid event
    // (missing externalId). The invalid payload gets a per-item validation error; the valid add and
    // remove succeed at their indexes.
    description: 'RETL: batch with a mix of valid add, valid remove and an invalid payload',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-009',
        email: 'e2e-fb-retl-009@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-010',
        email: 'e2e-fb-retl-010@segment.com'
      }),
      {
        // Invalid: externalId removed => fails schema validation before reaching Facebook.
        ...createE2ERetlAudienceEvent({
          eventName: 'new',
          computationKey: COMPUTATION_KEY,
          computationId: COMPUTATION_ID,
          externalAudienceId: '$externalAudienceId',
          userId: 'e2e-fb-retl-user-011',
          email: 'e2e-fb-retl-011@segment.com'
        }),
        userId: undefined as unknown as string
      }
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-retl-user-009', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-retl-user-010', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "The root value is missing the required field 'externalId'.",
          errorreporter: 'INTEGRATIONS'
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
