import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('Taguchi.syncEvent', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('snapshot', () => {
    it('should match snapshot', async () => {
      nock('https://api.taguchi.com.au')
        .post('/subscriber')
        .reply(200, [{ code: 200, name: 'Success', description: 'Event processed' }])
      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        userId: 'test-user-123',
        properties: {
          total: 123.5,
          products: [
            {
              sku: '1290W',
              price: 123.5,
              quantity: 1,
              name: 'Test Product',
              category: 'Electronics'
            }
          ],
          currency: 'USD',
          order_id: 'order-123',
          email: 'test@example.com'
        }
      })

      const { data } = await testDestination.testAction('syncEvent', {
        event,
        settings: {
          apiKey: 'test-api-key',
          integrationURL: 'https://api.taguchi.com.au',
          organizationId: '123'
        },
        mapping: {
          target: {
            ref: event.userId,
            email: event.properties?.email
          },
          isTest: false,
          eventType: 'p',
          eventData: {
            total: event.properties?.total,
            products: event.properties?.products,
            currency: event.properties?.currency,
            order_id: event.properties?.order_id
          }
        }
      })

      expect(data).toMatchSnapshot()
    })

    it('should match snapshot with minimal fields', async () => {
      nock('https://api.taguchi.com.au')
        .post('/subscriber')
        .reply(200, [{ code: 200, name: 'Success', description: 'Event processed' }])
      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        userId: 'test-user-123',
        properties: {
          total: 50.0,
          products: [
            {
              sku: 'SIMPLE-SKU',
              price: 50.0
            }
          ]
        }
      })

      const { data } = await testDestination.testAction('syncEvent', {
        event,
        settings: {
          apiKey: 'test-api-key',
          integrationURL: 'https://api.taguchi.com.au',
          organizationId: '123'
        },
        mapping: {
          target: {
            ref: event.userId
          },
          eventType: 'p',
          eventData: {
            total: event.properties?.total,
            products: event.properties?.products
          }
        }
      })

      expect(data).toMatchSnapshot()
    })
  })
})
