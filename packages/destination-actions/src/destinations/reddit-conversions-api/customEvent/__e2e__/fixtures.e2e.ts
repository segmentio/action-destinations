import type { E2EFixture, JSONObject } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import customEvent from '../index'
import { LEGACY_API_VERSION, LATEST_API_VERSION } from '../../versioning-info'

// customEvent shares the same action.ts factory as standardEvent, so batch/MultiStatusResponse
// behavior is already covered there - this file only needs to prove the V2/V3 version split works
// for the custom_event_name code path specifically (tracking_type is hardcoded to 'Custom' on V3
// whenever custom_event_name is present - see v3/utils-v3.ts).

let userSeq = 0
function nextUser(): string {
  userSeq += 1
  return `e2e-test-user-reddit-custom-${String(userSeq).padStart(3, '0')}`
}

const fixtures: E2EFixture[] = [
  {
    description: 'V2: successfully sends a Custom event',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(customEvent.fields),
      api_version: LEGACY_API_VERSION,
      custom_event_name: 'E2E Custom Event'
    },
    mode: 'single',
    event: createE2EEvent('track', 'E2E Custom Event', {
      userId: nextUser(),
      properties: { email: 'e2e-reddit-custom-v2@segment.com' }
    }),
    expect: { status: 'success' }
  },
  {
    description: 'V3: successfully sends a Custom event with action_source set',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(customEvent.fields),
      api_version: LATEST_API_VERSION,
      custom_event_name: 'E2E Custom Event',
      action_source: 'WEBSITE'
    },
    mode: 'single',
    event: createE2EEvent('track', 'E2E Custom Event', {
      userId: nextUser(),
      properties: { email: 'e2e-reddit-custom-v3@segment.com' },
      context: { page: { url: 'https://example.com/custom-event' } }
    }),
    expect: { status: 'success' }
  },
  {
    description: 'V3: rejects the mapping when action_source is not set (conditionally required only for V3)',
    subscribe: 'type = "track"',
    mapping: (() => {
      const mapping: JSONObject = {
        ...defaultValues(customEvent.fields),
        api_version: LATEST_API_VERSION,
        custom_event_name: 'E2E Custom Event'
      }
      delete mapping.action_source
      return mapping
    })(),
    mode: 'single',
    event: createE2EEvent('track', 'E2E Custom Event', {
      userId: nextUser(),
      properties: { email: 'e2e-reddit-custom-v3-missing-action-source@segment.com' }
    }),
    expect: {
      status: 'error',
      errorType: 'AggregateAjvError'
    },
    verboseFailureHint:
      'Same conditional-required action_source rule as standardEvent. If errorType does not match on first run, adjust to the real thrown error name.'
  }
]

export default fixtures
