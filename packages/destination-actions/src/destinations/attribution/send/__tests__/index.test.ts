import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const ATTRIBUTION_ENDPOINT = 'https://track.attributionapp.com'

describe('Attribution.send', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('track events', () => {
    it('should send a track event with all fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'test-message-id-123'

      const json = {
        type: 'track',
        messageId,
        timestamp,
        userId: 'user123',
        anonymousId: 'anon123',
        event: 'Product Purchased',
        properties: {
          product_id: 'prod_123',
          price: 99.99,
          currency: 'USD'
        },
        traits: {
          email: 'user@example.com',
          plan: 'premium'
        },
        context: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          library: {
            name: 'analytics.js',
            version: '4.0.0'
          },
          traits: {
            email: 'user@example.com',
            plan: 'premium'
          }
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/t', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Product Purchased',
        userId: 'user123',
        anonymousId: 'anon123',
        messageId,
        timestamp,
        properties: {
          product_id: 'prod_123',
          price: 99.99,
          currency: 'USD'
        },
        context: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          library: {
            name: 'analytics.js',
            version: '4.0.0'
          },
          traits: {
            email: 'user@example.com',
            plan: 'premium'
          }
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'track',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          event: { '@path': '$.event' },
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          properties: { '@path': '$.properties' },
          traits: { '@path': '$.context.traits' },
          context: { '@path': '$.context' }
        }
      })
    })

    it('should send a track event with minimal fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'msg-456'

      const json = {
        type: 'track',
        messageId,
        timestamp,
        event: 'Button Clicked',
        anonymousId: 'anon456'
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/t', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Button Clicked',
        anonymousId: 'anon456',
        messageId,
        timestamp
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'track',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          event: { '@path': '$.event' },
          anonymousId: { '@path': '$.anonymousId' }
        }
      })
    })
  })

  describe('page events', () => {
    it('should send a page event with all fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'page-msg-123'

      const json = {
        type: 'page',
        messageId,
        timestamp,
        userId: 'user789',
        anonymousId: 'anon789',
        name: 'Product Details',
        properties: {
          url: 'https://example.com/products/123',
          path: '/products/123',
          referrer: 'https://google.com'
        },
        traits: {
          email: 'user@example.com'
        },
        context: {
          ip: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
          traits: {
            email: 'user@example.com'
          }
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/p', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'page',
        name: 'Product Details',
        userId: 'user789',
        anonymousId: 'anon789',
        messageId,
        timestamp,
        properties: {
          url: 'https://example.com/products/123',
          path: '/products/123',
          referrer: 'https://google.com'
        },
        context: {
          ip: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
          traits: {
            email: 'user@example.com'
          }
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'page',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          name: { '@path': '$.name' },
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          properties: { '@path': '$.properties' },
          traits: { '@path': '$.context.traits' },
          context: { '@path': '$.context' }
        }
      })
    })

    it('should send a page event without name', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'page-msg-456'

      const json = {
        type: 'page',
        messageId,
        timestamp,
        userId: 'user999',
        properties: {
          url: 'https://example.com'
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/p', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'page',
        userId: 'user999',
        messageId,
        timestamp,
        properties: {
          url: 'https://example.com'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'page',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' },
          properties: { '@path': '$.properties' }
        }
      })
    })
  })

  describe('screen events', () => {
    it('should send a screen event with all fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'screen-msg-123'

      const json = {
        type: 'screen',
        messageId,
        timestamp,
        userId: 'user111',
        anonymousId: 'anon111',
        name: 'Dashboard',
        properties: {
          screen_id: 'dashboard_v2',
          loaded_at: '2024-01-15T10:29:55.000Z'
        },
        traits: {
          app_version: '1.2.3'
        },
        context: {
          device: {
            type: 'mobile',
            model: 'iPhone 13'
          },
          traits: {
            app_version: '1.2.3'
          }
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/s', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'screen',
        name: 'Dashboard',
        userId: 'user111',
        anonymousId: 'anon111',
        messageId,
        timestamp,
        properties: {
          screen_id: 'dashboard_v2',
          loaded_at: '2024-01-15T10:29:55.000Z'
        },
        context: {
          device: {
            type: 'mobile',
            model: 'iPhone 13'
          },
          traits: {
            app_version: '1.2.3'
          }
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'screen',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          name: { '@path': '$.name' },
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          properties: { '@path': '$.properties' },
          traits: { '@path': '$.context.traits' },
          context: { '@path': '$.context' }
        }
      })
    })
  })

  describe('identify events', () => {
    it('should send an identify event with all fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'identify-msg-123'

      const json = {
        type: 'identify',
        messageId,
        timestamp,
        userId: 'user222',
        anonymousId: 'anon222',
        traits: {
          email: 'newuser@example.com',
          firstName: 'John',
          lastName: 'Doe',
          plan: 'enterprise',
          company: 'Acme Inc'
        },
        context: {
          ip: '192.168.1.100'
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/i', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        userId: 'user222',
        anonymousId: 'anon222',
        messageId,
        timestamp,
        traits: {
          email: 'newuser@example.com',
          firstName: 'John',
          lastName: 'Doe',
          plan: 'enterprise',
          company: 'Acme Inc'
        },
        context: {
          ip: '192.168.1.100'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'identify',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          traits: { '@path': '$.traits' },
          context: { '@path': '$.context' }
        }
      })
    })

    it('should send an identify event with minimal fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'identify-msg-456'

      const json = {
        type: 'identify',
        messageId,
        timestamp,
        userId: 'user333'
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/i', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        userId: 'user333',
        messageId,
        timestamp
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'identify',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' }
        }
      })
    })
  })

  describe('group events', () => {
    it('should send a group event with all fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'group-msg-123'

      const json = {
        type: 'group',
        messageId,
        timestamp,
        userId: 'user444',
        anonymousId: 'anon444',
        groupId: 'group_acme',
        traits: {
          name: 'Acme Corporation',
          industry: 'Technology',
          employees: 500,
          plan: 'enterprise'
        },
        context: {
          ip: '10.20.30.40'
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/g', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'group',
        userId: 'user444',
        anonymousId: 'anon444',
        groupId: 'group_acme',
        messageId,
        timestamp,
        traits: {
          name: 'Acme Corporation',
          industry: 'Technology',
          employees: 500,
          plan: 'enterprise'
        },
        context: {
          ip: '10.20.30.40'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'group',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' },
          anonymousId: { '@path': '$.anonymousId' },
          groupId: { '@path': '$.groupId' },
          traits: { '@path': '$.traits' },
          context: { '@path': '$.context' }
        }
      })
    })
  })

  describe('alias events', () => {
    it('should send an alias event with all fields', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'alias-msg-123'

      const json = {
        type: 'alias',
        messageId,
        timestamp,
        userId: 'user_new_id',
        previousId: 'user_old_id',
        anonymousId: 'anon666',
        context: {
          ip: '172.16.0.1'
        }
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/a', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'alias',
        userId: 'user_new_id',
        previousId: 'user_old_id',
        anonymousId: 'anon666',
        messageId,
        timestamp,
        context: {
          ip: '172.16.0.1'
        }
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'alias',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' },
          previousId: { '@path': '$.previousId' },
          anonymousId: { '@path': '$.anonymousId' },
          context: { '@path': '$.context' }
        }
      })
    })

    it('should send an alias event without previousId', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'alias-msg-456'

      const json = {
        type: 'alias',
        messageId,
        timestamp,
        userId: 'user777'
      }

      nock(ATTRIBUTION_ENDPOINT).post('/v1/a', json).reply(200, { success: true })

      const event = createTestEvent({
        type: 'alias',
        userId: 'user777',
        messageId,
        timestamp
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID: 'test-project-123'
        },
        mapping: {
          type: 'alias',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          userId: { '@path': '$.userId' }
        }
      })
    })
  })

  describe('authentication', () => {
    it('should include Authorization header with projectID', async () => {
      const projectID = 'test-project-secret-123'
      const expectedAuth = `Basic ${Buffer.from(projectID + ':').toString('base64')}`

      const timestamp = '2024-01-15T10:30:00.000Z'
      const messageId = 'auth-test-msg'

      nock(ATTRIBUTION_ENDPOINT, {
        reqheaders: {
          authorization: expectedAuth
        }
      })
        .post('/v1/t')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Test Event',
        messageId,
        timestamp,
        userId: 'user888'
      })

      await testDestination.testAction('send', {
        event,
        settings: {
          projectID
        },
        mapping: {
          type: 'track',
          messageId: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          event: { '@path': '$.event' },
          userId: { '@path': '$.userId' }
        }
      })
    })
  })
})
