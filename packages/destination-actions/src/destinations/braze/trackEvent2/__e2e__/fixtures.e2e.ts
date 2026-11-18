/**
 * E2E fixtures for Braze `trackEvent2` (`POST /users/track`, `events`).
 *
 * Covers single, batch and batchWithMultistatus sends, a mixed batch judged per event; both sync modes; and our rejections before
 * any request: Ajv validation, an action's own IntegrationError code, a batch's per-event
 * multistatus errors, and an invalid subscription.
 *
 * Fixtures import from lib/e2e/helpers and types, not the lib/e2e index: the index loads the
 * registry, which loads these files.
 */
import type { E2EFixture } from '../../../../lib/e2e/types'
import { createE2EEvent } from '../../../../lib/e2e/helpers'

const ADD = { __segment_internal_sync_mode: 'add' }
const UPDATE = { __segment_internal_sync_mode: 'update' }

const track = (name: string, userId: string, properties: Record<string, string | number> = {}) =>
  createE2EEvent('track', name, { userId, properties })

// `time` defaults to $.receivedAt; these events drop it.
const noReceivedAt = { receivedAt: undefined }

const fixtures: E2EFixture[] = [
  {
    description: 'single track event is accepted by Braze /users/track',
    mode: 'single',
    subscribe: 'type = "track"',
    event: track('E2E Braze Event', 'e2e-braze-user-001', { order_id: '$guid:order', revenue: 42 }),
    mapping: ADD,
    expect: { status: 'success', httpStatus: 201, jsonContains: { message: 'success', events_processed: 1 } }
  },
  {
    description: 'single track event in update mode is accepted for an existing user',
    mode: 'single',
    subscribe: 'type = "track"',
    event: track('E2E Braze Update Event', 'e2e-braze-user-001'),
    mapping: UPDATE,
    expect: { status: 'success', bodyContains: 'success' }
  },
  {
    description: 'fixture mapping overrides the default, sending a literal event name',
    mode: 'single',
    subscribe: 'type = "track"',
    event: track('Ignored Name', 'e2e-braze-user-001'),
    mapping: { ...ADD, name: 'E2E Braze Mapped Name' },
    expect: { status: 'success', jsonContains: { events_processed: 1 } }
  },
  {
    description: 'track event identified by user alias only is accepted',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Braze Alias Event', {
      anonymousId: 'e2e-braze-anon-001'
    }),
    mapping: {
      ...ADD,
      user_alias: { alias_name: { '@path': '$.anonymousId' }, alias_label: 'e2e_anonymous_id' }
    },
    expect: { status: 'success', jsonContains: { events_processed: 1 } }
  },
  {
    description: 'batch of two events for one $guid-named order is accepted with the batch header',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      track('E2E Braze Batch A', 'e2e-braze-batch-001', { order_id: '$guid:order' }),
      track('E2E Braze Batch B', 'e2e-braze-batch-002', { order_id: '$guid:order' })
    ],
    mapping: ADD,
    expect: { status: 'success', jsonContains: { message: 'success', events_processed: 2 } }
  },
  {
    description: 'batch with per-item multistatus returns 2xx for every event',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      track('E2E Braze Multistatus A', 'e2e-braze-ms-001'),
      track('E2E Braze Multistatus B', 'e2e-braze-ms-002'),
      track('E2E Braze Multistatus C', 'e2e-braze-ms-003')
    ],
    mapping: ADD,
    expect: { status: 'success', jsonContains: { events_processed: 3 } }
  },
  {
    description: 'mixed batch sends only the valid event and reports each rejection per event',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      track('E2E Braze Mixed Valid', 'e2e-braze-mixed-001'),
      createE2EEvent('track', 'E2E Braze Mixed No User', {}),
      createE2EEvent('track', 'E2E Braze Mixed No Time', { userId: 'e2e-braze-mixed-003', ...noReceivedAt })
    ],
    mapping: ADD,
    expect: {
      status: 'multistatus',
      items: [
        { status: '2xx' },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
          errorreporter: 'INTEGRATIONS'
        },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "missing the required field 'time'",
          errorreporter: 'INTEGRATIONS'
        }
      ]
    }
  },
  {
    description: 'track event with no receivedAt fails validation of the required time field',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Braze No Time', { userId: 'e2e-braze-user-err-001', ...noReceivedAt }),
    mapping: ADD,
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: "missing the required field 'time'"
    },
    verboseFailureHint: 'time defaults to $.receivedAt; without it Ajv should reject before any request.'
  },
  {
    description: 'track event with no user identifier is rejected by the action before any request',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Braze No User', {}),
    mapping: ADD,
    expect: {
      status: 'error',
      errorType: 'Missing required fields',
      httpStatus: 400,
      errorMessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.'
    }
  },
  {
    description: 'single event with no sync mode is rejected with the action error code',
    mode: 'single',
    subscribe: 'type = "track"',
    event: track('E2E Braze No Sync Mode', 'e2e-braze-user-err-002'),
    mapping: {},
    expect: { status: 'error', errorType: 'Invalid syncMode', httpStatus: 400 }
  },
  {
    description: 'batch with no sync mode reports every event as a multistatus error',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      track('E2E Braze No Sync A', 'e2e-braze-user-err-003'),
      track('E2E Braze No Sync B', 'e2e-braze-user-err-004')
    ],
    mapping: {},
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: 'Invalid syncMode'
    }
  },
  {
    description: 'batch with no receivedAt reports every event as a validation error',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      createE2EEvent('track', 'E2E Braze Batch No Time A', { userId: 'e2e-braze-user-err-005', ...noReceivedAt }),
      createE2EEvent('track', 'E2E Braze Batch No Time B', { userId: 'e2e-braze-user-err-006', ...noReceivedAt })
    ],
    mapping: ADD,
    expect: { status: 'error', errorType: 'PAYLOAD_VALIDATION_FAILED', httpStatus: 400 }
  },
  {
    description: 'batch under an invalid subscription is rejected by core before any request',
    mode: 'batch',
    subscribe: '(type = "track"', // unbalanced: parseFql errors
    events: [
      track('E2E Braze Bad FQL A', 'e2e-braze-user-err-007'),
      track('E2E Braze Bad FQL B', 'e2e-braze-user-err-008')
    ],
    mapping: ADD,
    expect: { status: 'error', errorType: 'PAYLOAD_VALIDATION_FAILED', errorMessage: 'Invalid subscription' }
  }
]

export default fixtures
