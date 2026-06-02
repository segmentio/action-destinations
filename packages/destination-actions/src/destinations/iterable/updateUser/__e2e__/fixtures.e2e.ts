import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import updateUser from '../index'

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully upserts a user with email and data fields',
    subscribe: 'type = "identify"',
    mapping: defaultValues(updateUser.fields),
    mode: 'single',
    event: createE2EEvent('identify', 'Identify', {
      userId: 'e2e-test-user-001',
      traits: {
        email: 'e2e-test@segment.com',
        firstName: 'E2E',
        lastName: 'TestUser',
        plan: 'premium'
      }
    }),
    expect: {
      status: 'success'
    }
  }
]

export default fixtures
