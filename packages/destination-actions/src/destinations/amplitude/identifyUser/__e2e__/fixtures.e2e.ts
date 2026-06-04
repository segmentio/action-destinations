import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import identifyUser from '../index'

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully identifies a user with traits',
    subscribe: 'type = "identify"',
    mapping: defaultValues(identifyUser.fields),
    mode: 'single',
    event: createE2EEvent('identify', undefined, {
      userId: 'e2e-test-user-amplitude-001',
      traits: {
        email: 'e2e-test@segment.com',
        plan: 'enterprise',
        company: 'Segment'
      }
    }),
    expect: {
      status: 'success'
    }
  }
]

export default fixtures
