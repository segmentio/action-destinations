/**
 * E2E fixtures for Mixpanel `trackEvent` (the Import Events API, `/import`).
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
 *
 * Fixtures import from lib/e2e/helpers and types, not the lib/e2e index: the index loads the
 * registry, which loads these files.
 */
import type { E2EFixture } from '../../../../lib/e2e/types'
import { createE2EEvent } from '../../../../lib/e2e/helpers'

const fixtures: E2EFixture[] = [
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
    event: createE2EEvent('track', 'E2E Product Purchased', {
      userId: 'e2e-user-success-001',
      properties: { order_id: '$guid:order', revenue: 42 }
    }),
    mapping: {},
    expect: { status: 'success' }
  },
  {
    description: 'batch of two valid track events is accepted by Mixpanel /import',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      createE2EEvent('track', 'E2E Batch Event A', {
        userId: 'e2e-user-batch-001',
        properties: { seq: 'a' }
      }),
      createE2EEvent('track', 'E2E Batch Event B', {
        userId: 'e2e-user-batch-002',
        properties: { seq: 'b' }
      })
    ],
    mapping: {},
    expect: { status: 'success' }
  },
  {
    description: 'batch with per-item multistatus returns 2xx for every event',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      createE2EEvent('track', 'E2E Multistatus Event A', {
        userId: 'e2e-user-multistatus-001',
        properties: { seq: 'a' }
      }),
      createE2EEvent('track', 'E2E Multistatus Event B', {
        userId: 'e2e-user-multistatus-002',
        properties: { seq: 'b' }
      })
    ],
    mapping: {},
    features: { 'mixpanel-multistatus': true },
    expect: { status: 'success' }
  }
]

export default fixtures
