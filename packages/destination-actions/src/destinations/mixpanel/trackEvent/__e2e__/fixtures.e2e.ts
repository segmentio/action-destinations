/**
 * E2E fixtures for Mixpanel `trackEvent` (the Import Events API, `/import`).
 *
 * Inspired by action-destinations PR #3829's mixpanel fixtures, trimmed to a pilot set that
 * exercises the framework end to end:
 *
 *  - `error`   — a track event with no `event` name. `event` is a required field, so our code
 *                throws a payload-validation error BEFORE any request leaves. This fixture needs
 *                NO secrets and proves frame → serve → validate works. (Run it first.)
 *  - `success` — a single valid track event. Needs real E2E_MIXPANEL_* secrets; asserts the live
 *                Mixpanel `/import` response is 2xx.
 *  - `success` (batch) — two valid track events sent as a batch (array payload → performBatch).
 *
 * Note on modes: the local serve runner asserts the OUTBOUND HTTP exchange, not Segment's
 * per-item MultiStatusResponse (serve does not return it). `batchWithMultistatus` per-item
 * assertions are therefore an in-process/integrations-harness capability, not a serve-runner one.
 */
import type { E2EFixture } from '../../../../lib/e2e'
import { createE2EEvent } from '../../../../lib/e2e'

const fixtures: E2EFixture[] = [
  {
    description: 'track event with no event name is rejected by our validation before any request',
    mode: 'single',
    subscribe: 'type = "track"',
    // A track event carrying no `event` name. The action's required `event` field defaults to
    // $.event, which resolves to undefined here → PayloadValidationError, no request sent.
    event: {
      type: 'track',
      messageId: '$guid',
      timestamp: '$now',
      userId: 'e2e-user-error-001'
    },
    mapping: {},
    // `errorType` names the class our code throws (schema validation → AggregateAjvError). The local
    // serve runner asserts requestError + httpStatus + errorMessage (serve does not expose the class
    // name); an in-process harness can additionally assert `errorType`.
    expect: {
      status: 'error',
      errorType: 'AggregateAjvError',
      httpStatus: 500,
      errorMessage: "missing the required field 'event'"
    },
    verboseFailureHint:
      'Expected serve to return [{ requestError: true, statusCode: 500, ... }] because the required "event" field is missing.'
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
  }
]

export default fixtures
