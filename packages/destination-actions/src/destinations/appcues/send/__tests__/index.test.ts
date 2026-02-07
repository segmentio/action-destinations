import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const US_ENDPOINT = 'https://segment.appcues.com'
const EU_ENDPOINT = 'https://segment.eu.appcues.com'

describe('Appcues (Actions)', () => {
  describe('send', () => {
    it('should send a track event when event_name is present', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          anonymousId: 'anon123',
          event: 'Product Viewed',
          properties: {
            product_id: 'prod123',
            name: 'Test Product'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        anonymousId: 'anon123',
        properties: {
          product_id: 'prod123',
          name: 'Test Product'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event_name: { '@path': '$.event' },
          properties: { '@path': '$.properties' }
        }
      })
    })

    it('should send an identify event when user_traits is present', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'identify',
          userId: 'user123',
          anonymousId: 'anon123',
          traits: {
            email: 'test@example.com',
            name: 'Test User'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
        anonymousId: 'anon123',
        traits: {
          email: 'test@example.com',
          name: 'Test User'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          user_traits: { '@path': '$.traits' }
        }
      })
    })

    it('should send a group event when groupId is present', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'group',
          userId: 'user123',
          anonymousId: 'anon123',
          groupId: 'group123',
          traits: {
            name: 'Acme Inc',
            plan: 'enterprise'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'group',
        userId: 'user123',
        anonymousId: 'anon123',
        groupId: 'group123',
        traits: {
          name: 'Acme Inc',
          plan: 'enterprise'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          groupId: { '@path': '$.groupId' },
          group_traits: { '@path': '$.traits' }
        }
      })
    })

    it('should send multiple requests for track + identify', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          anonymousId: 'anon123',
          event: 'Product Viewed',
          properties: {
            product_id: 'prod123'
          }
        })
        .reply(200, { success: true })

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'identify',
          userId: 'user123',
          anonymousId: 'anon123',
          traits: {
            email: 'test@example.com'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        anonymousId: 'anon123',
        properties: {
          product_id: 'prod123'
        },
        traits: {
          email: 'test@example.com'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event_name: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          user_traits: { '@path': '$.traits' }
        }
      })
    })

    it('should send all three request types when all fields are present', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          anonymousId: 'anon123',
          event: 'Product Viewed',
          properties: {
            product_id: 'prod123'
          }
        })
        .reply(200, { success: true })

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'identify',
          userId: 'user123',
          anonymousId: 'anon123',
          traits: {
            email: 'test@example.com'
          }
        })
        .reply(200, { success: true })

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'group',
          userId: 'user123',
          anonymousId: 'anon123',
          groupId: 'group123',
          traits: {
            name: 'Acme Inc'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        anonymousId: 'anon123',
        groupId: 'group123',
        properties: {
          product_id: 'prod123'
        },
        traits: {
          email: 'test@example.com'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event_name: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          user_traits: { '@path': '$.traits' },
          groupId: { '@path': '$.groupId' },
          group_traits: {
            name: 'Acme Inc'
          }
        }
      })
    })

    it('should work with EU endpoint', async () => {
      nock(EU_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          event: 'Product Viewed'
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123'
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.eu.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          event_name: { '@path': '$.event' }
        }
      })
    })

    it('should throw error when no valid data is provided', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user123'
      })

      await expect(
        testDestination.testAction('send', {
          event,
          settings: {
            apiKey: 'test-api-key',
            endpoint: 'https://segment.appcues.com/v1/segment'
          },
          mapping: {
            userId: { '@path': '$.userId' }
          }
        })
      ).rejects.toThrowError('No valid data to send')
    })

    it('should not send identify when user_traits is empty', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          event: 'Product Viewed'
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123'
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          endpoint: 'https://segment.appcues.com/v1/segment'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          event_name: { '@path': '$.event' },
          user_traits: {}
        }
      })
    })
  })
})
