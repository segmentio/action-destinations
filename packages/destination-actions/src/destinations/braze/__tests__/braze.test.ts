import nock from 'nock'
import { createTestEvent, createTestIntegration, DecoratedResponse, SegmentEvent } from '@segment/actions-core'
import Braze from '../index'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(Braze)
const receivedAt = '2021-08-03T17:40:04.055Z'
const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com' as const
}

describe('Braze Cloud Mode (Actions)', () => {
  describe('updateUserProfile', () => {
    it('should work with default mappings', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        receivedAt
      })

      const responses = await testDestination.testAction('updateUserProfile', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.headers).toMatchSnapshot()
      expect(responses[0].options.json).toMatchSnapshot()
    })

    it('should require one of braze_id, user_alias, or external_id', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        receivedAt
      })

      await expect(
        testDestination.testAction('updateUserProfile', {
          event,
          settings,
          mapping: {}
        })
      ).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should allow email address with unicode local part to be sent to Braze', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'ünîcòde_émail_locał_part@segment.com'
        },
        event: undefined,
        receivedAt
      })

      const responses = await testDestination.testAction('updateUserProfile', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        attributes: expect.arrayContaining([
          expect.objectContaining({
            email: 'ünîcòde_émail_locał_part@segment.com'
          })
        ])
      })
    })
  })

  describe('trackEvent', () => {
    it('should require one of braze_id, user_alias, or external_id', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        event: 'Test Event',
        type: 'track',
        receivedAt
      })

      await expect(
        testDestination.testAction('trackEvent', {
          event,
          settings,
          mapping: {
            external_id: '',
            user_alias: {},
            braze_id: '',
            name: 'Test User',
            time: receivedAt
          }
        })
      ).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should work with default mappings', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        event: 'Test Event',
        type: 'track',
        receivedAt
      })

      const responses = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.headers).toMatchSnapshot()
      expect(responses[0].options.json).toMatchSnapshot()
    })

    it('should work with batched events', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Test Event 1',
          type: 'track',
          receivedAt
        }),
        createTestEvent({
          event: 'Test Event 2',
          type: 'track',
          receivedAt
        })
      ]

      const responses = await testDestination.testBatchAction('trackEvent', {
        events,
        useDefaultMappings: true,
        mapping: {
          external_id: {
            '@path': '$.userId'
          },
          user_alias: {},
          braze_id: {
            '@path': '$.properties.braze_id'
          },
          name: {
            '@path': '$.event'
          },
          time: {
            '@path': '$.receivedAt'
          },
          properties: {
            '@path': '$.properties'
          },
          enable_batching: true,
          _update_existing_only: true
        },
        settings: {
          ...settings
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.headers).toMatchSnapshot()
      expect(responses[0].options.json).toMatchObject({
        events: [
          {
            external_id: 'user1234',
            app_id: 'my-app-id',
            name: 'Test Event 1',
            time: '2021-08-03T17:40:04.055Z',
            properties: {},
            _update_existing_only: true
          },
          {
            external_id: 'user1234',
            app_id: 'my-app-id',
            name: 'Test Event 2',
            time: '2021-08-03T17:40:04.055Z',
            properties: {},
            _update_existing_only: true
          }
        ]
      })
    })

    it('should work with batched events with single element', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Test Event 1',
          type: 'track',
          receivedAt
        })
      ]

      const responses = await testDestination.testBatchAction('trackEvent', {
        events,
        useDefaultMappings: true,
        mapping: {
          external_id: {
            '@path': '$.userId'
          },
          user_alias: {},
          braze_id: {
            '@path': '$.properties.braze_id'
          },
          name: {
            '@path': '$.event'
          },
          time: {
            '@path': '$.receivedAt'
          },
          properties: {
            '@path': '$.properties'
          },
          enable_batching: true,
          _update_existing_only: true
        },
        settings: {
          ...settings
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.headers).toMatchSnapshot()
      expect(responses[0].options.json).toMatchObject({
        events: [
          {
            external_id: 'user1234',
            app_id: 'my-app-id',
            name: 'Test Event 1',
            time: '2021-08-03T17:40:04.055Z',
            properties: {},
            _update_existing_only: true
          }
        ]
      })
    })
  })

  describe('trackPurchase', () => {
    it('should require one of braze_id, user_alias, or external_id', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        event: 'Order Completed',
        type: 'track',
        receivedAt,
        properties: {
          products: [
            {
              product_id: 'test-product-id',
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }
          ]
        }
      })

      await expect(
        testDestination.testAction('trackPurchase', {
          event,
          settings,
          mapping: {
            external_id: '',
            user_alias: {},
            braze_id: '',
            name: 'Test User',
            time: receivedAt,
            products: {
              '@path': '$.properties.products'
            }
          }
        })
      ).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should skip if no products are available', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        type: 'track',
        receivedAt,
        properties: {
          products: []
        }
      })

      const responses = await testDestination.testAction('trackPurchase', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(0)
    })

    it('should work with default mappings', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

      const event = createTestEvent({
        event: 'Order Completed',
        type: 'track',
        receivedAt,
        properties: {
          products: [
            {
              product_id: 'test-product-id',
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }
          ]
        }
      })

      const responses = await testDestination.testAction('trackPurchase', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.headers).toMatchSnapshot()
      expect(responses[0].options.json).toMatchObject({
        purchases: [
          {
            external_id: 'user1234',
            app_id: 'my-app-id',
            time: '2021-08-03T17:40:04.055Z',
            properties: { products: [{ product_id: 'test-product-id', currency: 'USD', price: 99.99, quantity: 1 }] },
            _update_existing_only: false,
            product_id: 'test-product-id',
            currency: 'USD',
            price: 99.99,
            quantity: 1
          }
        ]
      })
    })
  })

  describe('onDelete', () => {
    it('should support user deletions', async () => {
      nock('https://rest.iad-01.braze.com').post('/users/delete').reply(200, {})
      expect(testDestination.onDelete).toBeDefined()

      if (testDestination.onDelete) {
        const event = createTestEvent({
          type: 'delete',
          userId: 'sloth@segment.com'
        })

        const response = await testDestination.onDelete(event, settings)
        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({})
      }
    })

    it('should support alternate endpoints for user deletions', async () => {
      nock('https://rest.iad-06.braze.com').post('/users/delete').reply(200, {})
      expect(testDestination.onDelete).toBeDefined()

      if (testDestination.onDelete) {
        const event = createTestEvent({
          type: 'delete',
          userId: 'sloth@segment.com'
        })

        const localSettings = { ...settings, endpoint: 'https://rest.iad-06.braze.com' }

        const response = await testDestination.onDelete(event, localSettings)
        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({})
      }
    })
  })
})
