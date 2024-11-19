import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { API_URL } from '../../config'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'

const settings: Settings = {
  apiKey: 'test-api-key'
}

const validPayload = {
  timestamp: timestamp,
  event: 'Event Type 1',
  messageId: 'message_id_1',
  type: 'track',
  userId: 'user_id_1',
  context: {
    traits: {
      phone: "+3538675765689",
      email: "test@test.com",
      clientUserId: "123e4567-e89b-12d3-a456-426614174000"
    }
  },
  properties: {
    tracking_url: "https://tracking-url.com",
    product_name: "Product X"
  }
} as Partial<SegmentEvent>

const mapping = {
  type: { '@path': '$.event' },
  userIdentifiers: {
    phone: { '@path': '$.context.traits.phone' },
    email: { '@path': '$.context.traits.email' },
    clientUserId: { '@path': '$.context.traits.clientUserId' }
  },
  properties: { '@path': '$.properties' },
  externalEventId: { '@path': '$.messageId' },
  occurredAt: { '@path': '$.timestamp' }
}

const expectedPayload = {
  type: 'Event Type 1',
  properties: {
    tracking_url: 'https://tracking-url.com',
    product_name: 'Product X'
  },
  externalEventId: 'message_id_1',
  occurredAt: '2024-01-08T13:52:50.212Z',
  user: {
    phone: '+3538675765689',
    email: 'test@test.com',
    externalIdentifiers: {
      clientUserId: '123e4567-e89b-12d3-a456-426614174000'
    }
  }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Attentive.customEvents', () => {

  it('Should send a custom event to Attentive', async () => {

    const event = createTestEvent(validPayload)

    nock('https://api.attentivemobile.com').post('/v1/events/custom', expectedPayload).reply(200, {})

    const responses = await testDestination.testAction('customEvents', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  
  })

  // it('should throw an error for invalid phone number format', async () => {
  //   const user = {
  //     email: 'test@example.com',
  //     phone: 'invalid-phone-number',
  //     externalIdentifiers: { clientUserId: 'string' }
  //   }
  //   const properties = {
  //     mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
  //     orderStatusURL: 'https://example.com/orderstatus/54321',
  //     delivery_date: 'May 10',
  //     'Order Id': '54321',
  //     products: ['productId1', 'productId2'],
  //     shipment: {
  //       carrier: 'fedex',
  //       trackingNumber: '12345'
  //     }
  //   }

  //   const event = createTestEvent({
  //     type: 'track',
  //     timestamp: '2021-03-30T14:38:29+0000'
  //   })

  //   const mapping = { user, type: 'Order Shipped', properties, externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70' }

  //   await expect(testDestination.testAction('trackEvent', { event, mapping, settings })).rejects.toThrowError(
  //     'invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.'
  //   )
  // })

  // it('should successfully send an Order Shipped event with correct parameters', async () => {
  //   const requestBody = {
  //     type: 'Order Shipped',
  //     properties: {
  //       mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
  //       orderStatusURL: 'https://example.com/orderstatus/54321',
  //       delivery_date: 'May 10',
  //       'Order Id': '54321',
  //       products: ['productId1', 'productId2'],
  //       shipment: {
  //         carrier: 'fedex',
  //         trackingNumber: '12345'
  //       }
  //     },
  //     externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70',
  //     occurredAt: '2021-03-30T14:38:29+0000',
  //     user: {
  //       phone: '+13115552368',
  //       email: 'test@gmail.com',
  //       externalIdentifiers: {
  //         clientUserId: 'string',
  //         customIdentifiers: [
  //           {
  //             name: 'string',
  //             value: 'string'
  //           }
  //         ]
  //       }
  //     }
  //   }

  //   nock(`${API_URL}`).post('/v1/events/custom', requestBody).reply(200, {})

  //   const event = createTestEvent({
  //     type: 'track',
  //     timestamp: '2021-03-30T14:38:29+0000'
  //   })

  //   const mapping = {
  //     user: {
  //       phone: '+13115552368',
  //       email: 'test@gmail.com',
  //       externalIdentifiers: {
  //         clientUserId: 'string',
  //         customIdentifiers: [
  //           {
  //             name: 'string',
  //             value: 'string'
  //           }
  //         ]
  //       }
  //     },
  //     type: 'Order Shipped',
  //     properties: {
  //       mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
  //       orderStatusURL: 'https://example.com/orderstatus/54321',
  //       delivery_date: 'May 10',
  //       'Order Id': '54321',
  //       products: ['productId1', 'productId2'],
  //       shipment: {
  //         carrier: 'fedex',
  //         trackingNumber: '12345'
  //       }
  //     },
  //     externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70'
  //   }

  //   await expect(
  //     testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
  //   ).resolves.not.toThrowError()
  // })

  // it('should throw an error if the API request fails', async () => {
  //   const requestBody = {
  //     type: 'Order Shipped',
  //     properties: {
  //       mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
  //       orderStatusURL: 'https://example.com/orderstatus/54321',
  //       delivery_date: 'May 10',
  //       'Order Id': '54321',
  //       products: ['productId1', 'productId2'],
  //       shipment: {
  //         carrier: 'fedex',
  //         trackingNumber: '12345'
  //       }
  //     },
  //     externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70',
  //     occurredAt: '2021-03-30T14:38:29+0000',
  //     user: {
  //       phone: '+13115552368',
  //       email: 'test@gmail.com',
  //       externalIdentifiers: {
  //         clientUserId: 'string',
  //         customIdentifiers: [
  //           {
  //             name: 'string',
  //             value: 'string'
  //           }
  //         ]
  //       }
  //     }
  //   }

  //   nock(`${API_URL}`).post('/v1/events/custom', requestBody).reply(500, {})

  //   const event = createTestEvent({
  //     type: 'track',
  //     timestamp: '2021-03-30T14:38:29+0000'
  //   })

  //   const mapping = {
  //     user: {
  //       phone: '+13115552368',
  //       email: 'test@gmail.com',
  //       externalIdentifiers: {
  //         clientUserId: 'string',
  //         customIdentifiers: [
  //           {
  //             name: 'string',
  //             value: 'string'
  //           }
  //         ]
  //       }
  //     },
  //     type: 'Order Shipped',
  //     properties: {
  //       mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
  //       orderStatusURL: 'https://example.com/orderstatus/54321',
  //       delivery_date: 'May 10',
  //       'Order Id': '54321',
  //       products: ['productId1', 'productId2'],
  //       shipment: {
  //         carrier: 'fedex',
  //         trackingNumber: '12345'
  //       }
  //     },
  //     externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70'
  //   }

  //   await expect(
  //     testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
  //   ).rejects.toThrowError('Internal Server Error')
  // })
})
