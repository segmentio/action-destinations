import nock from 'nock'
import { IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../../config'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

describe('Track Event', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should throw error if no user identifiers are provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })
    const mapping = { user: {}, type: 'fake-name', properties: {} }

    await expect(testDestination.testAction('trackEvent', { event, mapping, settings })).rejects.toThrowError(
      IntegrationError
    )
  })

  it('should throw an error for invalid phone number format', async () => {
    const user = {
      email: 'test@example.com',
      phone: 'invalid-phone-number',
      externalIdentifiers: { clientUserId: 'string' }
    }
    const properties = {
      mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
      orderStatusURL: 'https://example.com/orderstatus/54321',
      delivery_date: 'May 10',
      'Order Id': '54321',
      products: ['productId1', 'productId2'],
      shipment: {
        carrier: 'fedex',
        trackingNumber: '12345'
      }
    }

    const event = createTestEvent({
      type: 'track',
      timestamp: '2021-03-30T14:38:29+0000'
    })

    const mapping = { user, type: 'Order Shipped', properties, externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70' }

    await expect(testDestination.testAction('trackEvent', { event, mapping, settings })).rejects.toThrowError(
      'invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.'
    )
  })

  it('should successfully send an Order Shipped event with correct parameters', async () => {
    const requestBody = {
      type: 'Order Shipped',
      properties: {
        mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
        orderStatusURL: 'https://example.com/orderstatus/54321',
        delivery_date: 'May 10',
        'Order Id': '54321',
        products: ['productId1', 'productId2'],
        shipment: {
          carrier: 'fedex',
          trackingNumber: '12345'
        }
      },
      externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70',
      occurredAt: '2021-03-30T14:38:29+0000',
      user: {
        phone: '+13115552368',
        email: 'test@gmail.com',
        externalIdentifiers: {
          clientUserId: 'string',
          customIdentifiers: [
            {
              name: 'string',
              value: 'string'
            }
          ]
        }
      }
    }

    nock(`${API_URL}`).post('/v1/events/custom', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2021-03-30T14:38:29+0000'
    })

    const mapping = {
      user: {
        phone: '+13115552368',
        email: 'test@gmail.com',
        externalIdentifiers: {
          clientUserId: 'string',
          customIdentifiers: [
            {
              name: 'string',
              value: 'string'
            }
          ]
        }
      },
      type: 'Order Shipped',
      properties: {
        mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
        orderStatusURL: 'https://example.com/orderstatus/54321',
        delivery_date: 'May 10',
        'Order Id': '54321',
        products: ['productId1', 'productId2'],
        shipment: {
          carrier: 'fedex',
          trackingNumber: '12345'
        }
      },
      externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the API request fails', async () => {
    const requestBody = {
      type: 'Order Shipped',
      properties: {
        mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
        orderStatusURL: 'https://example.com/orderstatus/54321',
        delivery_date: 'May 10',
        'Order Id': '54321',
        products: ['productId1', 'productId2'],
        shipment: {
          carrier: 'fedex',
          trackingNumber: '12345'
        }
      },
      externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70',
      occurredAt: '2021-03-30T14:38:29+0000',
      user: {
        phone: '+13115552368',
        email: 'test@gmail.com',
        externalIdentifiers: {
          clientUserId: 'string',
          customIdentifiers: [
            {
              name: 'string',
              value: 'string'
            }
          ]
        }
      }
    }

    nock(`${API_URL}`).post('/v1/events/custom', requestBody).reply(500, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2021-03-30T14:38:29+0000'
    })

    const mapping = {
      user: {
        phone: '+13115552368',
        email: 'test@gmail.com',
        externalIdentifiers: {
          clientUserId: 'string',
          customIdentifiers: [
            {
              name: 'string',
              value: 'string'
            }
          ]
        }
      },
      type: 'Order Shipped',
      properties: {
        mediaUrl: 'https://cdn.example.com/images/sample-image.jpg',
        orderStatusURL: 'https://example.com/orderstatus/54321',
        delivery_date: 'May 10',
        'Order Id': '54321',
        products: ['productId1', 'productId2'],
        shipment: {
          carrier: 'fedex',
          trackingNumber: '12345'
        }
      },
      externalEventId: '37fb97a9-6cfd-4983-bd65-68d104d53b70'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).rejects.toThrowError('Internal Server Error')
  })
})
