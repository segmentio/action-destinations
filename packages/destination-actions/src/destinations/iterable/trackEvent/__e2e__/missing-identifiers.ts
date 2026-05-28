import type { E2EFixture } from '@segment/actions-core'

const fixture: E2EFixture = {
  description: 'Rejects event when both email and userId are missing',
  subscribe: 'type = "track"',
  mapping: {
    eventName: { '@path': '$.event' },
    dataFields: { '@path': '$.properties' },
    createdAt: { '@path': '$.timestamp' }
  },
  event: {
    type: 'track',
    event: 'Button Clicked',
    timestamp: '2024-01-15T10:30:00.000Z',
    properties: {
      buttonId: 'cta-hero'
    }
  },
  expect: {
    status: 'error',
    errorType: 'PayloadValidationError',
    errorMessage: 'Must include email or userId.'
  }
}

export default fixture
