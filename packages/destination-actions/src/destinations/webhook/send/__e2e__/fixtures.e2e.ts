/**
 * E2E fixtures for Webhook `send`, delivered to httpbin.org.
 *
 * httpbin's `/anything` echoes the request back with the parsed JSON body under `json`, so the
 * success fixtures assert that the payload our mapping built is exactly what reached the endpoint,
 * not just that it returned 2xx. `/status/404` gives a real non-2xx response for the failure path.
 * None of these need secrets.
 */
import type { E2EFixture } from '../../../../lib/e2e'
import { createE2EEvent } from '../../../../lib/e2e'

const ECHO_URL = 'https://httpbin.org/anything'

const fixtures: E2EFixture[] = [
  {
    description: 'single track event is delivered with the mapped payload',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Order Completed', {
      userId: 'e2e-webhook-user-001',
      properties: { order_id: 'e2e-order-001', revenue: 42 }
    }),
    mapping: {
      url: ECHO_URL,
      method: 'POST',
      data: {
        event: { '@path': '$.event' },
        user_id: { '@path': '$.userId' },
        order_id: { '@path': '$.properties.order_id' },
        revenue: { '@path': '$.properties.revenue' }
      }
    },
    expect: {
      status: 'success',
      httpStatus: 200,
      jsonContains: {
        method: 'POST',
        json: { event: 'E2E Order Completed', user_id: 'e2e-webhook-user-001', order_id: 'e2e-order-001', revenue: 42 }
      }
    }
  },
  {
    description: 'single track event is delivered with PUT',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Put Event', { userId: 'e2e-webhook-user-002' }),
    mapping: {
      url: ECHO_URL,
      method: 'PUT',
      data: { event: { '@path': '$.event' } }
    },
    expect: { status: 'success', httpStatus: 200, jsonContains: { method: 'PUT', json: { event: 'E2E Put Event' } } }
  },
  {
    description: 'batch of two track events is delivered as one JSON array',
    mode: 'batch',
    subscribe: 'type = "track"',
    events: [
      createE2EEvent('track', 'E2E Batch A', { userId: 'e2e-webhook-batch-001' }),
      createE2EEvent('track', 'E2E Batch B', { userId: 'e2e-webhook-batch-002' })
    ],
    mapping: {
      url: ECHO_URL,
      method: 'POST',
      data: { event: { '@path': '$.event' }, user_id: { '@path': '$.userId' } }
    },
    expect: {
      status: 'success',
      httpStatus: 200,
      jsonContains: {
        json: [
          { event: 'E2E Batch A', user_id: 'e2e-webhook-batch-001' },
          { event: 'E2E Batch B', user_id: 'e2e-webhook-batch-002' }
        ]
      }
    }
  },
  {
    description: 'non-2xx from the endpoint is surfaced as a failure with its status',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Not Found', { userId: 'e2e-webhook-user-404' }),
    mapping: { url: 'https://httpbin.org/status/404', method: 'POST' },
    expect: { status: 'failure', httpStatus: 404 }
  },
  {
    description: 'missing url is rejected by our validation before any request',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E No Url', { userId: 'e2e-webhook-user-err-001' }),
    mapping: { method: 'POST' },
    // errorType is the normalized Segment code; the local serve runner asserts the message only
    // (serve does not return the error class).
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      errorMessage: "missing the required field 'url'"
    }
  },
  {
    description: 'invalid url is rejected by our validation before any request',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Bad Url', { userId: 'e2e-webhook-user-err-002' }),
    mapping: { url: 'not-a-url', method: 'POST' },
    expect: { status: 'error', errorType: 'PAYLOAD_VALIDATION_FAILED', errorMessage: 'must be a valid URI' }
  }
]

export default fixtures
