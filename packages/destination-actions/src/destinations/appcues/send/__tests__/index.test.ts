import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const US_ENDPOINT = 'https://segment.appcues.com'
const EU_ENDPOINT = 'https://segment.eu.appcues.com'

describe('Appcues (Actions)', () => {
  describe('send', () => {
    it('should send a track event', async () => {
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

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        anonymousId: 'anon123',
        properties: {
          product_id: 'prod123'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'track',
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' }
        }
      })
    })

    it('should send a page event', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'page',
          userId: 'user123',
          name: 'Home',
          properties: {
            url: 'https://example.com'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'page',
        name: 'Home',
        userId: 'user123',
        properties: {
          url: 'https://example.com'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'page',
          userId: { '@path': '$.userId' },
          name: { '@path': '$.name' },
          properties: { '@path': '$.properties' }
        }
      })
    })

    it('should send a screen event', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'screen',
          userId: 'user123',
          name: 'Dashboard',
          properties: {
            screen_id: 'screen123'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'screen',
        name: 'Dashboard',
        userId: 'user123',
        properties: {
          screen_id: 'screen123'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'screen',
          userId: { '@path': '$.userId' },
          name: { '@path': '$.name' },
          properties: { '@path': '$.properties' }
        }
      })
    })

    it('should send an identify event', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            name: 'Test User'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
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
          type: 'identify',
          userId: { '@path': '$.userId' },
          user_traits: { '@path': '$.traits' }
        }
      })
    })

    it('should send a group event', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'group',
          userId: 'user123',
          groupId: 'group123',
          traits: {
            name: 'Acme Inc'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'group',
        userId: 'user123',
        groupId: 'group123',
        traits: {
          name: 'Acme Inc'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'group',
          userId: { '@path': '$.userId' },
          groupId: { '@path': '$.groupId' },
          group_traits: { '@path': '$.traits' }
        }
      })
    })

    it('should send track + identify when user_traits is populated', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
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
          traits: {
            email: 'test@example.com'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        properties: {
          product_id: 'prod123'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'track',
          userId: { '@path': '$.userId' },
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          user_traits: {
            email: 'test@example.com'
          }
        }
      })
    })

    it('should send page + identify + group when user_traits and group_traits are populated', async () => {
      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'page',
          userId: 'user123',
          name: 'Home'
        })
        .reply(200, { success: true })

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com'
          }
        })
        .reply(200, { success: true })

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'group',
          userId: 'user123',
          groupId: 'group123',
          traits: {
            name: 'Acme Inc'
          }
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'page',
        name: 'Home',
        userId: 'user123'
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'page',
          userId: { '@path': '$.userId' },
          name: { '@path': '$.name' },
          user_traits: {
            email: 'test@example.com'
          },
          groupId: 'group123',
          group_traits: {
            name: 'Acme Inc'
          }
        }
      })
    })

    it('should include context, integrations, timestamp, and messageId', async () => {
      const timestamp = '2024-01-01T00:00:00.000Z'
      const messageId = 'test-message-id-123'
      const context = {
        library: { name: 'analytics.js', version: '4.0.0' }
      }
      const integrations = {
        All: false,
        Appcues: true
      }

      nock(US_ENDPOINT)
        .post('/v1/segment', {
          type: 'track',
          userId: 'user123',
          event: 'Product Viewed',
          context,
          integrations,
          timestamp,
          messageId
        })
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Viewed',
        userId: 'user123',
        context,
        integrations,
        timestamp,
        messageId
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          apiKey: 'test-api-key',
          region: 'US'
        },
        mapping: {
          type: 'track',
          userId: { '@path': '$.userId' },
          event: { '@path': '$.event' },
          context: { '@path': '$.context' },
          integrations: { '@path': '$.integrations' },
          timestamp: { '@path': '$.timestamp' },
          messageId: { '@path': '$.messageId' }
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
          type: 'track',
          userId: { '@path': '$.userId' },
          event: { '@path': '$.event' }
        }
      })
    })

    it('should throw error when event name is missing for track type', async () => {
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
            type: 'track',
            userId: { '@path': '$.userId' }
          }
        })
      ).rejects.toThrowError('Event name is required for track events')
    })

    it('should throw error when groupId is missing for group type', async () => {
      const event = createTestEvent({
        type: 'group',
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
            type: 'group',
            userId: { '@path': '$.userId' }
          }
        })
      ).rejects.toThrowError('Group ID is required for group events')
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
            type: 'track',
            userId: { '@path': '$.userId' },
            event: { '@path': '$.event' }
          }
        })
      ).rejects.toThrowError('Invalid region')
    })

    it('should throw error for invalid event type', async () => {
      const event = createTestEvent({
        type: 'alias',
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
            type: 'alias',
            userId: { '@path': '$.userId' }
          }
        })
      ).rejects.toThrowError('Invalid event type')
    })
  })
})
