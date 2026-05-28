import type { E2EFixture } from '@segment/actions-core'

const fixture: E2EFixture = {
  description: 'Successfully tracks a purchase event',
  subscribe: 'type = "track"',
  mapping: {
    email: { '@path': '$.properties.email' },
    eventName: { '@path': '$.event' },
    dataFields: { '@path': '$.properties' },
    createdAt: { '@path': '$.timestamp' },
    id: { '@path': '$.messageId' }
  },
  event: {
    type: 'track',
    event: 'Order Completed',
    userId: 'e2e-test-user-001',
    messageId: 'e2e-msg-001',
    timestamp: '2024-01-15T10:30:00.000Z',
    properties: {
      email: 'e2e-test@segment.com',
      orderId: 'test-order-123',
      total: 49.99
    }
  },
  expect: {
    status: 'success'
  }
}

export default fixture
