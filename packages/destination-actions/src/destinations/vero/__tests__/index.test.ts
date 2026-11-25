import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_URL } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = { authToken: 'test-token' }
const timestamp = '2024-01-01T00:00:00.000Z'

const base = new URL(API_URL)
const apiPath = (path: string) => `${base.pathname}${path}`

afterEach(() => {
  nock.cleanAll()
})

describe('Vero', () => {
  describe('authentication', () => {
    it('sends the auth token as a query parameter', async () => {
      nock(base.origin).post(apiPath('/events/track')).query({ auth_token: 'test-token' }).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
        event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp }),
        useDefaultMappings: true,
        settings
      })
      expect(responses[0].status).toBe(200)
    })

    it('maps 401 to an authentication error', async () => {
      nock(base.origin).post(apiPath('/events/track')).query(true).reply(401, {})
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('trackEvent', () => {
    it('builds the request body', async () => {
      let body: unknown
      nock(base.origin)
        .post(apiPath('/events/track'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('trackEvent', {
        event: createTestEvent({
          type: 'track',
          event: '  Order Completed ',
          userId: ' u1 ',
          timestamp,
          context: { traits: { email: 'a@b.com' } },
          properties: { total: 10, vip: true, items: ['a'], note: ' hi ', empty: null }
        }),
        useDefaultMappings: true,
        settings
      })

      expect(body).toEqual({
        identity: { id: 'u1', email: 'a@b.com' },
        event_name: 'Order Completed',
        data: { total: '10', vip: 'true', items: '["a"]', note: 'hi' },
        extras: { source: 'Segment', created_at: timestamp }
      })
    })

    it('injects the deduplication value when mapped', async () => {
      let body: any
      nock(base.origin)
        .post(apiPath('/events/track'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('trackEvent', {
        event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', messageId: 'msg-1', timestamp }),
        useDefaultMappings: true,
        mapping: { deduplicationValue: { '@path': '$.messageId' } },
        settings
      })

      expect(body.data.segment_event_id).toBe('msg-1')
    })

    it('does not inject a deduplication value by default', async () => {
      let body: any
      nock(base.origin)
        .post(apiPath('/events/track'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('trackEvent', {
        event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp, properties: {} }),
        useDefaultMappings: true,
        settings
      })

      expect(body.data).toEqual({})
    })

    it('throws when neither user id nor email is present', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: undefined, timestamp, context: {} }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow('Either User ID or Email is required.')
    })

    it('throws on an invalid email', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { email: 'not-an-email' },
          settings
        })
      ).rejects.toThrow()
    })

    it('throws on an invalid timestamp', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { createdAt: 'nope' },
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('identifyUser', () => {
    it('builds the request body', async () => {
      let body: unknown
      nock(base.origin)
        .post(apiPath('/users/track'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('identifyUser', {
        event: createTestEvent({
          type: 'identify',
          userId: 'u1',
          timestamp,
          traits: { email: 'a@b.com', plan: 'pro', age: 30, timezone: 'x', language: 'x', userAgent: 'x' },
          context: {
            locale: 'en-US',
            userAgent: 'UA',
            device: { token: 'tok', type: 'iOS' }
          }
        }),
        useDefaultMappings: true,
        mapping: { timezone: 10, updateOnly: true, pushDevices: [{ token: 'tok', platform: 'ios' }] },
        settings
      })

      expect(body).toEqual({
        id: 'u1',
        email: 'a@b.com',
        channels: [{ type: 'push', address: 'tok', platform: 'ios' }],
        data: { email: 'a@b.com', plan: 'pro', age: '30', language: 'en-US', userAgent: 'UA', timezone: 10 },
        extras: { created_at: timestamp, update_only: 'true' }
      })
    })

    it('rejects a push device with an unsupported platform', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { pushDevices: [{ token: 'a', platform: 'windows' }] },
          settings
        })
      ).rejects.toThrow('Platform must be one of')
    })

    it('drops push devices with a blank token', async () => {
      let body: any
      nock(base.origin)
        .post(apiPath('/users/track'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('identifyUser', {
        event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
        useDefaultMappings: true,
        mapping: {
          pushDevices: [{ token: '  ', platform: 'ios' }]
        },
        settings
      })

      expect(body.channels).toBeUndefined()
    })

    it('sends topic preferences', async () => {
      let body: any
      nock(base.origin)
        .post(apiPath('/users/track'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('identifyUser', {
        event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
        useDefaultMappings: true,
        mapping: {
          topicPreferences: [
            { id: 3, status: 'subscribed' },
            { name: 'News', status: 'unsubscribed' }
          ]
        },
        settings
      })

      expect(body.preferences).toEqual({
        topics: [
          { id: 3, status: 'subscribed' },
          { name: 'News', status: 'unsubscribed' }
        ]
      })
    })

    it('throws on a topic preference with both id and name', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { topicPreferences: [{ id: 3, name: 'News', status: 'subscribed' }] },
          settings
        })
      ).rejects.toThrow('either an ID or a name, not both')
    })

    it('throws on a topic preference with neither id nor name', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { topicPreferences: [{ status: 'subscribed' }] },
          settings
        })
      ).rejects.toThrow('Topic Preference requires an ID or a name.')
    })
  })

  describe('manageSubscriptions', () => {
    it.each(['unsubscribe', 'resubscribe'])('calls the %s endpoint', async (subscriptionAction) => {
      let body: unknown
      nock(base.origin)
        .post(apiPath(`/users/${subscriptionAction}`), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('manageSubscriptions', {
        event: createTestEvent({ type: 'track', userId: 'u1', timestamp }),
        useDefaultMappings: true,
        mapping: { subscriptionAction },
        settings
      })

      expect(body).toEqual({ id: 'u1' })
    })

    it('throws on an unknown subscription action', async () => {
      await expect(
        testDestination.testAction('manageSubscriptions', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { subscriptionAction: 'pause' },
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('manageTags', () => {
    const audienceEvent = (membership: boolean) =>
      createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: 'u1',
        timestamp,
        context: { personas: { computation_class: 'audience', computation_key: 'vip' } },
        properties: { audience_key: 'vip', vip: membership }
      })

    it('adds the audience key when the user enters the audience', async () => {
      let body: unknown
      nock(base.origin)
        .put(apiPath('/users/tags/edit'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('manageTags', {
        event: audienceEvent(true),
        useDefaultMappings: true,
        settings
      })

      expect(body).toEqual({ id: 'u1', add: ['vip'] })
    })

    it('removes the audience key when the user leaves the audience', async () => {
      let body: unknown
      nock(base.origin)
        .put(apiPath('/users/tags/edit'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('manageTags', {
        event: audienceEvent(false),
        useDefaultMappings: true,
        settings
      })

      expect(body).toEqual({ id: 'u1', remove: ['vip'] })
    })

    it('adds and removes explicit tags, trimmed and de-duplicated', async () => {
      let body: unknown
      nock(base.origin)
        .put(apiPath('/users/tags/edit'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('manageTags', {
        event: createTestEvent({ type: 'track', userId: 'u1', timestamp, context: {} }),
        useDefaultMappings: true,
        mapping: { tagsToAdd: [' a ', 'a', ''], tagsToRemove: ['b'] },
        settings
      })

      expect(body).toEqual({ id: 'u1', add: ['a'], remove: ['b'] })
    })

    it('throws when the same tag is added and removed', async () => {
      await expect(
        testDestination.testAction('manageTags', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp, context: {} }),
          useDefaultMappings: true,
          mapping: { tagsToAdd: ['a'], tagsToRemove: ['a'] },
          settings
        })
      ).rejects.toThrow('cannot be both added and removed')
    })

    it('throws when there is nothing to add or remove', async () => {
      await expect(
        testDestination.testAction('manageTags', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp, context: {} }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow('At least one tag to add or remove is required.')
    })

    it('throws when membership is known but the audience key is empty', async () => {
      await expect(
        testDestination.testAction('manageTags', {
          event: audienceEvent(true),
          useDefaultMappings: true,
          mapping: { audienceKey: '' },
          settings
        })
      ).rejects.toThrow('Audience Key is required when syncing audience membership.')
    })

    it('throws when an audience key is set but membership is unknown', async () => {
      await expect(
        testDestination.testAction('manageTags', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp, context: {} }),
          useDefaultMappings: true,
          mapping: { audienceKey: 'vip' },
          settings
        })
      ).rejects.toThrow('Audience membership could not be determined')
    })
  })

  describe('aliasUser', () => {
    it('builds the request body', async () => {
      let body: unknown
      nock(base.origin)
        .put(apiPath('/users/reidentify'), (b) => {
          body = b
          return true
        })
        .query(true)
        .reply(200, {})

      await testDestination.testAction('aliasUser', {
        event: createTestEvent({ type: 'alias', previousId: ' old ', userId: 'new', timestamp }),
        useDefaultMappings: true,
        settings
      })

      expect(body).toEqual({ id: 'old', new_id: 'new' })
    })

    it('throws when the ids are the same', async () => {
      await expect(
        testDestination.testAction('aliasUser', {
          event: createTestEvent({ type: 'alias', previousId: 'a', userId: 'a', timestamp }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow('New ID must be different from Previous ID.')
    })

    it('throws when the previous id is missing', async () => {
      await expect(
        testDestination.testAction('aliasUser', {
          event: createTestEvent({ type: 'alias', previousId: undefined, userId: 'a', timestamp }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('onDelete', () => {
    const payload = createTestEvent({ userId: 'u1' })

    it('deletes the user', async () => {
      let body: unknown
      nock(base.origin)
        .post(apiPath('/users/delete'), (b) => {
          body = b
          return true
        })
        .query({ auth_token: 'test-token' })
        .reply(200, {})

      await testDestination.onDelete?.(payload, settings)
      expect(body).toEqual({ id: 'u1' })
    })

    it('throws on a 404', async () => {
      nock(base.origin).post(apiPath('/users/delete')).query(true).reply(404, {})
      await expect(testDestination.onDelete?.(payload, settings)).rejects.toThrow()
    })

    it('throws on a server error', async () => {
      nock(base.origin).post(apiPath('/users/delete')).query(true).reply(500, {})
      await expect(testDestination.onDelete?.(payload, settings)).rejects.toThrow()
    })
  })
})
