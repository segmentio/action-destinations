import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_URL } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = { authToken: 'test-token' }
const timestamp = '2024-01-01T00:00:00.000Z'

const base = new URL(API_URL)
const apiPath = (path: string) => `${base.pathname}${path}`

function captureBody(method: 'post' | 'put', path: string) {
  const captured: { body?: any } = {}
  nock(base.origin)
    [method](apiPath(path), (b) => {
      captured.body = b
      return true
    })
    .query(true)
    .reply(200, {})
  return captured
}

afterEach(() => {
  nock.cleanAll()
})

describe('Vero validation', () => {
  describe('HTTP errors', () => {
    for (const status of [401, 429, 500]) {
      it(`surfaces a ${status} response`, async () => {
        nock(base.origin).post(apiPath('/events/track')).query(true).reply(status, {})
        await expect(
          testDestination.testAction('trackEvent', {
            event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp }),
            useDefaultMappings: true,
            settings
          })
        ).rejects.toMatchObject({ response: { status } })
      })
    }
  })

  describe('identifiers', () => {
    it('throws when the user id is longer than 255 characters', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: 'a'.repeat(256), timestamp }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow('User ID must be less than 255 characters.')
    })

    it('treats a whitespace-only user id as missing and sends the email', async () => {
      const captured = captureBody('post', '/events/track')
      await testDestination.testAction('trackEvent', {
        event: createTestEvent({ type: 'track', event: 'Order', userId: '   ', timestamp }),
        useDefaultMappings: true,
        mapping: { email: 'a@b.com' },
        settings
      })
      expect(captured.body.identity).toEqual({ email: 'a@b.com' })
    })

    it('throws when the user id is whitespace only and there is no email', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: '   ', timestamp, context: {} }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow('Either User ID or Email is required.')
    })

    it('sends an email-only identify', async () => {
      const captured = captureBody('post', '/users/track')
      await testDestination.testAction('identifyUser', {
        event: createTestEvent({
          type: 'identify',
          userId: undefined,
          timestamp,
          traits: { email: 'a@b.com' },
          context: {}
        }),
        useDefaultMappings: true,
        settings
      })
      expect(captured.body.id).toBeUndefined()
      expect(captured.body.email).toBe('a@b.com')
    })

    it('throws when a subscription change has no user id', async () => {
      await expect(
        testDestination.testAction('manageSubscriptions', {
          event: createTestEvent({ type: 'track', userId: undefined, timestamp }),
          useDefaultMappings: true,
          mapping: { subscriptionAction: 'unsubscribe' },
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('trackEvent', () => {
    it('throws when the event name is blank', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { eventName: '   ' },
          settings
        })
      ).rejects.toThrow('Event Name is required.')
    })

    it('throws when the event name is longer than 255 characters', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { eventName: 'a'.repeat(256) },
          settings
        })
      ).rejects.toThrow('Event Name must be less than 255 characters.')
    })

    it('rejects an invalid timestamp', async () => {
      await expect(
        testDestination.testAction('trackEvent', {
          event: createTestEvent({ type: 'track', event: 'Order', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { createdAt: 'not-a-date' },
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('identifyUser', () => {
    it('strips reserved keys from user properties', async () => {
      const captured = captureBody('post', '/users/track')
      await testDestination.testAction('identifyUser', {
        event: createTestEvent({
          type: 'identify',
          userId: 'u1',
          timestamp,
          traits: { plan: 'pro', timezone: 'x', language: 'x', userAgent: 'x' },
          context: {}
        }),
        useDefaultMappings: true,
        settings
      })
      expect(captured.body.data).toEqual({ plan: 'pro' })
    })

    it('stringifies objects and drops null values in user properties', async () => {
      const captured = captureBody('post', '/users/track')
      await testDestination.testAction('identifyUser', {
        event: createTestEvent({
          type: 'identify',
          userId: 'u1',
          timestamp,
          traits: { obj: { a: 1 }, nothing: null, count: 5, flag: false, blank: '   ' },
          context: {}
        }),
        useDefaultMappings: true,
        settings
      })
      expect(captured.body.data).toEqual({ obj: '{"a":1}', count: '5', flag: 'false' })
    })

    it('sends the timezone as a number alongside string properties', async () => {
      const captured = captureBody('post', '/users/track')
      await testDestination.testAction('identifyUser', {
        event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: { plan: 'pro' }, context: {} }),
        useDefaultMappings: true,
        mapping: { timezone: -5 },
        settings
      })
      expect(captured.body.data).toEqual({ plan: 'pro', timezone: -5 })
    })

    it('rejects a timezone that is not in the allowed list', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { timezone: 5.5 },
          settings
        })
      ).rejects.toThrow('Timezone must be one of')
    })

    it('rejects an unsupported push platform', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { pushDevices: [{ token: 'a', platform: 'windows' }] },
          settings
        })
      ).rejects.toThrow('Platform must be one of')
    })

    it('rejects a topic id below 1', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { topicPreferences: [{ id: 0, status: 'subscribed' }] },
          settings
        })
      ).rejects.toThrow()
    })

    it('rejects an unsupported topic status', async () => {
      await expect(
        testDestination.testAction('identifyUser', {
          event: createTestEvent({ type: 'identify', userId: 'u1', timestamp, traits: {}, context: {} }),
          useDefaultMappings: true,
          mapping: { topicPreferences: [{ name: 'News', status: 'maybe' }] },
          settings
        })
      ).rejects.toThrow('Status must be one of')
    })
  })

  describe('manageSubscriptions', () => {
    it('rejects an unknown subscription action', async () => {
      await expect(
        testDestination.testAction('manageSubscriptions', {
          event: createTestEvent({ type: 'track', userId: 'u1', timestamp }),
          useDefaultMappings: true,
          mapping: { subscriptionAction: 'pause' },
          settings
        })
      ).rejects.toThrow('Subscription Action must be one of')
    })
  })

  describe('manageTags', () => {
    it('combines the audience key with explicit tags', async () => {
      const captured = captureBody('put', '/users/tags/edit')
      await testDestination.testAction('manageTags', {
        event: createTestEvent({
          type: 'track',
          event: 'Audience Entered',
          userId: 'u1',
          timestamp,
          context: { personas: { computation_class: 'audience', computation_key: 'vip' } },
          properties: { vip: true }
        }),
        useDefaultMappings: true,
        mapping: { tagsToAdd: ['x'], tagsToRemove: ['y'] },
        settings
      })
      expect(captured.body).toEqual({ id: 'u1', add: ['x', 'vip'], remove: ['y'] })
    })

    it('throws when the user id is missing', async () => {
      await expect(
        testDestination.testAction('manageTags', {
          event: createTestEvent({ type: 'track', userId: undefined, timestamp, context: {} }),
          useDefaultMappings: true,
          mapping: { tagsToAdd: ['a'] },
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('aliasUser', () => {
    it('throws when the new id is missing', async () => {
      await expect(
        testDestination.testAction('aliasUser', {
          event: createTestEvent({ type: 'alias', previousId: 'old', userId: undefined, timestamp }),
          useDefaultMappings: true,
          settings
        })
      ).rejects.toThrow()
    })
  })

  describe('onDelete', () => {
    it('throws when the user id is blank', async () => {
      await expect(testDestination.onDelete?.(createTestEvent({ userId: '   ' }), settings)).rejects.toThrow(
        'User ID is required.'
      )
    })
  })
})
