import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const US_ENDPOINT = 'https://segment.appcues.com'
const EU_ENDPOINT = 'https://segment.eu.appcues.com'

describe('Appcues (Actions)', () => {
  describe('send', () => {
    it('should send a track event when event is present', async () => {
      const timestamp = '2024-01-01T00:00:00.000Z'
      const messageId = 'test-message-id-123'

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          anonymousId: 'anon123',
          event: 'Product Viewed',
          properties: {
            product_id: 'prod123',
            name: 'Test Product'
          },
          timestamp,
          messageId
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        anonymousId: 'anon123',
        timestamp,
        messageId,
        properties: {
          product_id: 'prod123',
          name: 'Test Product'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          timestamp: { '@path': '$.timestamp' },
          messageId: { '@path': '$.messageId' }
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
          region: 'US'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          user_traits: { '@path': '$.traits' }
        }
      })
    })

    it('should use context.traits for user_traits with conditional default', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            plan: 'enterprise'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
        context: {
          traits: {
            email: 'test@example.com',
            plan: 'enterprise'
          }
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        useDefaultMappings: true
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
          region: 'US'
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
          region: 'US'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event: { '@path': '$.event' },
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
          region: 'US'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          user_traits: { '@path': '$.traits' },
          groupId: { '@path': '$.groupId' },
          group_traits: {
            name: 'Acme Inc'
          }
        }
      })
    })

    it('should include context and integrations when present', async () => {
      const context = {
        library: { name: 'analytics.js', version: '4.0.0' },
        page: { url: 'https://example.com' }
      }
      const integrations = {
        All: false,
        Appcues: true
      }

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          event: 'Page Viewed',
          context,
          integrations
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Page Viewed',
        userId: 'user123',
        context,
        integrations
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          event: { '@path': '$.event' },
          context: { '@path': '$.context' },
          integrations: { '@path': '$.integrations' }
        }
      })
    })

    it('should work with EU region', async () => {
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
          region: 'EU'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          event: { '@path': '$.event' }
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
            region: 'US'
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
          region: 'US'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          event: { '@path': '$.event' },
          user_traits: {}
        }
      })
    })

    it('should throw error for invalid region', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123'
      })

      await expect(
        testDestination.testAction('send', {
          event,
          settings: {
            apiKey: 'test-api-key',
            region: 'INVALID'
          },
          mapping: {
            userId: { '@path': '$.userId' },
            event: { '@path': '$.event' }
          }
        })
      ).rejects.toThrowError('Invalid region')
    })
  })
})
