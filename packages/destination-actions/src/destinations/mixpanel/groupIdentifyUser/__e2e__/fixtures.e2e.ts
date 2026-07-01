import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import groupIdentifyUser from '../index'

// groupIdentifyUser only implements perform() (no performBatch), so every fixture is single-mode.
// It authenticates via the project token in the request body and is unaffected by the
// actions-mixpanel-project-token-auth feature flag.
const fixtures: E2EFixture[] = [
  {
    description: 'Successfully updates a group profile with traits',
    subscribe: 'type = "group"',
    mapping: defaultValues(groupIdentifyUser.fields),
    mode: 'single',
    event: createE2EEvent('group', undefined, {
      userId: 'e2e-test-user-mixpanel-group-001',
      groupId: 'e2e-test-group-001',
      traits: {
        name: 'Segment E2E Co',
        industry: 'Software',
        employees: 42
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Rejects a group event when traits are missing',
    subscribe: 'type = "group"',
    // Drop the traits mapping so the action throws its "traits is a required field" IntegrationError
    // before any HTTP request is made.
    mapping: (() => {
      const { traits, ...rest } = defaultValues(groupIdentifyUser.fields)
      return rest
    })(),
    mode: 'single',
    event: createE2EEvent('group', undefined, {
      userId: 'e2e-test-user-mixpanel-group-002',
      groupId: 'e2e-test-group-002'
    }),
    expect: {
      status: 'error',
      errorType: 'IntegrationError',
      errorMessage: '"traits" is a required field'
    }
  }
]

export default fixtures
