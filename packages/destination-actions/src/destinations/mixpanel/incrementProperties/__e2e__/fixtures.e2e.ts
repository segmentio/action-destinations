import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import incrementProperties from '../index'

// incrementProperties only implements perform() (no performBatch), so every fixture is single-mode.
// It authenticates via the project token in the request body and is unaffected by the
// actions-mixpanel-project-token-auth feature flag.
const fixtures: E2EFixture[] = [
  {
    description: 'Successfully increments numeric user properties',
    subscribe: 'type = "track"',
    mapping: defaultValues(incrementProperties.fields),
    mode: 'single',
    event: createE2EEvent('track', 'Increment Properties', {
      userId: 'e2e-test-user-mixpanel-increment-001',
      properties: {
        increment: {
          purchases: 1,
          items: 6
        }
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Rejects increment with a non-numeric value before sending',
    subscribe: 'type = "track"',
    mapping: defaultValues(incrementProperties.fields),
    mode: 'single',
    event: createE2EEvent('track', 'Increment Properties', {
      userId: 'e2e-test-user-mixpanel-increment-002',
      properties: {
        increment: {
          purchases: 'not-a-number'
        }
      }
    }),
    expect: {
      status: 'error',
      errorType: 'IntegrationError',
      errorMessage: 'The key "purchases" was not numeric'
    }
  }
]

export default fixtures
