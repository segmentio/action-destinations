import type { E2EFixture } from '@segment/actions-core'

const fixture: E2EFixture = {
  description: 'Successfully upserts a user with email and data fields',
  subscribe: 'type = "identify"',
  mapping: {
    email: { '@path': '$.traits.email' },
    userId: { '@path': '$.userId' },
    dataFields: { '@path': '$.traits' }
  },
  event: {
    type: 'identify',
    userId: 'e2e-test-user-001',
    traits: {
      email: 'e2e-test@segment.com',
      firstName: 'E2E',
      lastName: 'TestUser',
      plan: 'premium'
    }
  },
  expect: {
    status: 'success'
  }
}

export default fixture
