import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import identifyUser from '../index'

// identifyUser only implements perform() (no performBatch), so every fixture is single-mode.
// It authenticates via the project token in the request body, so it is unaffected by the
// actions-mixpanel-project-token-auth feature flag.
const fixtures: E2EFixture[] = [
  {
    description: 'Successfully identifies a user with traits',
    subscribe: 'type = "identify"',
    mapping: defaultValues(identifyUser.fields),
    mode: 'single',
    event: createE2EEvent('identify', undefined, {
      userId: 'e2e-test-user-mixpanel-identify-001',
      traits: {
        email: 'e2e-identify@segment.com',
        firstName: 'E2E',
        lastName: 'Tester',
        plan: 'enterprise',
        company: 'Segment'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully identifies a user and aliases an anonymousId to a userId',
    subscribe: 'type = "identify"',
    mapping: defaultValues(identifyUser.fields),
    mode: 'single',
    event: createE2EEvent('identify', undefined, {
      userId: 'e2e-test-user-mixpanel-identify-002',
      anonymousId: '$guid:anon',
      traits: {
        email: 'e2e-identify-alias@segment.com'
      }
    }),
    expect: {
      status: 'success'
    }
  }
]

export default fixtures
