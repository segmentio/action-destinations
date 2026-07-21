import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)

describe('Taguchi Destination Snapshots', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('syncAudience action', () => {
    it('should match snapshot with required fields', async () => {
      nock('https://api.taguchi.com.au')
        .post('/subscriber')
        .reply(200, [{ code: 200, name: 'Success', description: 'Subscriber processed' }])

      const event = createTestEvent({
        type: 'identify',
        userId: 'test-user-123',
        traits: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe'
        }
      })

      const { data } = await testDestination.testAction('syncAudience', {
        event,
        settings: {
          apiKey: 'test-api-key',
          integrationURL: 'https://api.taguchi.com.au',
          organizationId: '123'
        },
        mapping: {
          identifiers: {
            ref: event.userId,
            email: event.traits?.email
          },
          traits: {
            firstname: event.traits?.first_name,
            lastname: event.traits?.last_name
          },
          timestamp: event.timestamp
        }
      })

      expect(data).toMatchSnapshot()
    })

    it('should match snapshot with all fields', async () => {
      nock('https://api.taguchi.com.au')
        .post('/subscriber')
        .reply(200, [{ code: 200, name: 'Success', description: 'Subscriber processed' }])

      const event = createTestEvent({
        type: 'identify',
        userId: 'test-user-123',
        traits: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          title: 'Mr',
          birthday: '1990-01-01T00:00:00.000Z',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postal_code: '12345',
          phone: '555-1234',
          gender: 'Male'
        }
      })

      const { data } = await testDestination.testAction('syncAudience', {
        event,
        settings: {
          apiKey: 'test-api-key',
          integrationURL: 'https://api.taguchi.com.au',
          organizationId: '123'
        },
        mapping: {
          identifiers: {
            ref: event.userId,
            email: event.traits?.email
          },
          traits: {
            title: event.traits?.title,
            firstname: event.traits?.first_name,
            lastname: event.traits?.last_name,
            dob: event.traits?.birthday,
            address: event.traits?.street,
            suburb: event.traits?.city,
            state: event.traits?.state,
            country: event.traits?.country,
            postcode: event.traits?.postal_code,
            phone: event.traits?.phone,
            gender: event.traits?.gender
          },
          subscribeLists: ['123', '456'],
          unsubscribeLists: ['789'],
          timestamp: event.timestamp
        }
      })

      expect(data).toMatchSnapshot()
    })
  })

  describe('syncEvent action', () => {
    it('should match snapshot with required fields', async () => {
      nock('https://api.taguchi.com.au')
        .post('/subscriber')
        .reply(200, [{ code: 200, name: 'Success', description: 'Event processed' }])

      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        userId: 'test-user-123',
        properties: {
          total: 123.5,
          products: [{ sku: '1290W', price: 123.5 }],
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
          eventType: 'p',
          eventData: {
            total: event.properties?.total,
            products: event.properties?.products
          }
        }
      })

      expect(data).toMatchSnapshot()
    })

    it('should match snapshot with all fields', async () => {
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
  })
})
