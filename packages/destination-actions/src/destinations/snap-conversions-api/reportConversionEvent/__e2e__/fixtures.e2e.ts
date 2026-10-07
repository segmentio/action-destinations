import type { E2EFixture, JSONObject, SegmentEvent } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import reportConversionEvent from '../index'

let seq = 0
function nextEmail(): string {
  seq += 1
  return `e2e-snap-${String(seq).padStart(3, '0')}@segment.com`
}

function webEvent(): SegmentEvent {
  return createE2EEvent('track', 'Order Completed', {
    userId: `e2e-test-user-snap-${seq + 1}`,
    properties: { email: nextEmail(), revenue: 49.99, currency: 'USD' },
    context: {
      ip: '8.8.8.8',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)',
      page: { url: 'https://segment.com/academy/' }
    }
  })
}

function appEvent(): SegmentEvent {
  return createE2EEvent('track', 'Order Completed', {
    userId: `e2e-test-user-snap-${seq + 1}`,
    properties: { email: nextEmail(), revenue: 49.99, currency: 'USD' },
    context: {
      ip: '8.8.8.8',
      app: { namespace: 'com.segment.e2e', version: '1.0.0' },
      os: { name: 'iOS', version: '17.0' },
      device: { model: 'iPhone15,2', adTrackingEnabled: true }
    }
  })
}

function mapping(overrides: JSONObject): JSONObject {
  return { ...defaultValues(reportConversionEvent.fields), event_name: 'PURCHASE', ...overrides }
}

const fixtures: E2EFixture[] = [
  {
    description: 'Native WEB action_source is accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ action_source: 'WEB' }),
    mode: 'single',
    event: webEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'Legacy website action_source is normalized to WEB and accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ action_source: 'website' }),
    mode: 'single',
    event: webEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'Native MOBILE_APP action_source is accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ action_source: 'MOBILE_APP' }),
    mode: 'single',
    event: appEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'Legacy app action_source is normalized to MOBILE_APP and accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ action_source: 'app' }),
    mode: 'single',
    event: appEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'Native OFFLINE action_source is accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ action_source: 'OFFLINE' }),
    mode: 'single',
    event: webEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'Legacy physical_store action_source is normalized to OFFLINE and accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ action_source: 'physical_store' }),
    mode: 'single',
    event: webEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'event_conversion_type alone, with no action_source, falls back and is accepted',
    subscribe: 'type = "track"',
    mapping: mapping({ event_conversion_type: 'WEB' }),
    mode: 'single',
    event: webEvent(),
    expect: { status: 'success', httpStatus: 200, jsonContains: { status: 'VALID' } }
  },
  {
    description: 'Neither action_source nor event_conversion_type fails before any request is sent',
    subscribe: 'type = "track"',
    mapping: mapping({}),
    mode: 'single',
    event: webEvent(),
    expect: {
      status: 'error',
      errorType: 'IntegrationError',
      errorMessage: "The root value is missing the required field 'action_source'.",
      httpStatus: 400
    }
  }
]

export default fixtures
