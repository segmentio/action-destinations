/**
 * Component test fixtures for Mixpanel `trackEvent` (the Import Events API, `/import`).
 *
 * Inspired by action-destinations PR #3829's mixpanel fixtures, trimmed to a pilot set that
 * exercises the framework end to end:
 *
 *  - `error`   — a track event with no `event` name. `event` is a required field, so our code
 *                throws a payload-validation error BEFORE any request leaves.
 *  - `error` (batch) — the same in a batch: core reports each event's validation error as a
 *                multistatus item instead of throwing, and sends nothing.
 *  - `success` — a single valid track event; asserts the live Mixpanel `/import` response is 2xx.
 *  - `success` (batch) — two valid track events sent as a batch (performBatch).
 *  - `success` (batchWithMultistatus) — the same batch with per-item multistatus enabled; every
 *                item must come back 2xx.
 *  - `success` — the event name comes from the mapping, not the event.
 *  - `failure` (single, batch) — strict mode rejects an event timed in the future with a 400.
 *  - `multistatus` — a batch of valid, future-timed, valid events: only the middle item fails.
 *
 * Strict mode off is in non-strict.ct.ts. Fixtures import from lib/component-test/helpers and
 * types, not the lib/component-test index: the index loads the registry, which loads these files.
 */
import type { CTFixture } from '../../../../lib/component-test/types'
import { createCTEvent } from '../../../../lib/component-test/helpers'

// A time Mixpanel's strict mode rejects. createCTEvent always stamps now, so these are built by hand.
export const FUTURE = '2099-01-01T00:00:00.000Z'
export const futureEvent = (userId: string) => ({
  type: 'track' as const,
  event: 'E2E Future Event',
  messageId: '$guid',
  timestamp: FUTURE,
  receivedAt: '$now',
  userId
})

const fixtures: CTFixture[] = [
  {
    description: 'track event with no event name is rejected by our validation before any request',
    mode: 'single',
    subscribe: 'type = "track"',
    // A track event carrying no `event` name. The action's required `event` field defaults to
    // $.event, which resolves to undefined here → payload validation error, no request sent.
    event: {
      type: 'track',
      messageId: '$guid',
      timestamp: '$now',
      userId: 'e2e-user-error-001'
    },
    mapping: {},
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: "missing the required field 'event'"
    },
    verboseFailureHint: 'The required "event" field is missing, so validation should fail before any request.'
  },
  {
    description: 'batch of track events with no event name is rejected by our validation before any request',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      { type: 'track', messageId: '$guid', timestamp: '$now', userId: 'e2e-user-error-002' },
      { type: 'track', messageId: '$guid', timestamp: '$now', userId: 'e2e-user-error-003' }
    ],
    mapping: {},
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: "missing the required field 'event'"
    }
  },
  {
    description: 'single valid track event is accepted by Mixpanel /import',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createCTEvent('track', 'E2E Product Purchased', {
      userId: 'e2e-user-success-001',
      properties: { order_id: '$guid:order', revenue: 42 }
    }),
    mapping: {},
    features: { 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'success' }
  },
  {
    description: 'batch of two valid track events is accepted by Mixpanel /import',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      createCTEvent('track', 'E2E Batch Event A', {
        userId: 'e2e-user-batch-001',
        properties: { seq: 'a' }
      }),
      createCTEvent('track', 'E2E Batch Event B', {
        userId: 'e2e-user-batch-002',
        properties: { seq: 'b' }
      })
    ],
    mapping: {},
    features: { 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'success' }
  },
  {
    description: 'batch with per-item multistatus returns 2xx for every event',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      createCTEvent('track', 'E2E Multistatus Event A', {
        userId: 'e2e-user-multistatus-001',
        properties: { seq: 'a' }
      }),
      createCTEvent('track', 'E2E Multistatus Event B', {
        userId: 'e2e-user-multistatus-002',
        properties: { seq: 'b' }
      })
    ],
    mapping: {},
    features: { 'mixpanel-multistatus': true, 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'success' }
  },
  {
    description: 'event name from the mapping is accepted by Mixpanel /import',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createCTEvent('track', 'E2E Unmapped Name', { userId: 'e2e-user-mapping-001' }),
    mapping: { event: 'E2E Mapped Event Name' },
    features: { 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'success', httpStatus: 200, jsonContains: { num_records_imported: 1 } }
  },
  {
    description: 'future-timed event is rejected by Mixpanel strict mode',
    mode: 'single',
    subscribe: 'type = "track"',
    event: futureEvent('e2e-user-future-001'),
    mapping: {},
    features: { 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'failure', httpStatus: 400, bodyContains: 'properties.time' }
  },
  {
    description: 'batch with a future-timed event is rejected by Mixpanel strict mode',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      createCTEvent('track', 'E2E Batch Valid', { userId: 'e2e-user-future-002' }),
      futureEvent('e2e-user-future-003')
    ],
    mapping: {},
    features: { 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'failure', httpStatus: 400, bodyContains: 'properties.time' }
  },
  {
    description: 'multistatus batch reports only the future-timed event as failed',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      createCTEvent('track', 'E2E Mixed Valid A', { userId: 'e2e-user-mixed-001' }),
      futureEvent('e2e-user-mixed-002'),
      createCTEvent('track', 'E2E Mixed Valid C', { userId: 'e2e-user-mixed-003' })
    ],
    mapping: {},
    features: { 'mixpanel-multistatus': true, 'actions-mixpanel-project-token-auth': true },
    expect: {
      status: 'multistatus',
      items: [
        { status: '2xx' },
        { status: 400, errortype: 'BAD_REQUEST', errormessage: 'time', errorreporter: 'DESTINATION' },
        { status: '2xx' }
      ]
    }
  }
]

export default fixtures
