import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../index'
import { HEAP_SEGMENT_CLOUD_LIBRARY_NAME as LIBRARY } from '../sendEvent/constants'

const testDestination = createTestIntegration(Destination)

const APP_ID = '123456789'
const US_URL = 'https://heapanalytics.com'
const EU_URL = 'https://c.eu.heap-api.com'
const TRACK_URI = '/api/integrations/track'
const ADD_USER_PROPERTIES_URI = '/api/integrations/add_user_properties'

const timestamp = '2021-08-17T15:21:15.449Z'

// Registers a one-shot interceptor and returns a holder whose `.value` is the
// exact JSON body Heap received — so each test can assert the full payload.
function capture(baseUrl: string, path: string, status = 200): { value?: unknown } {
  const holder: { value?: unknown } = {}
  nock(baseUrl)
    .post(path)
    .reply(status, (_uri, body) => {
      holder.value = body
      return {}
    })
  return holder
}

async function run(event: Partial<SegmentEvent>, region?: string) {
  return testDestination.testAction('sendEvent', {
    event,
    useDefaultMappings: true,
    settings: { appId: APP_ID, ...(region ? { region } : {}) }
  })
}

describe('Heap Cloud', () => {
  afterEach(() => {
    const pendingMocks = nock.pendingMocks()
    nock.cleanAll()
    expect(pendingMocks).toHaveLength(0)
  })

  describe('track calls', () => {
    it('sends the track event and updates user properties for an identified user', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: 'user-1',
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: { traits: { name: 'Katherine Johnson', email: 'kj@example.com' } }
      })

      const profile = capture(US_URL, ADD_USER_PROPERTIES_URI)
      const track = capture(US_URL, TRACK_URI)

      const responses = await run(event)

      expect(responses.length).toBe(2)
      expect(profile.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        users: [
          {
            user_identifier: { identity: 'user-1' },
            custom_properties: { name: 'Katherine Johnson', email: 'kj@example.com' }
          }
        ]
      })
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Purchase',
            user_identifier: { identity: 'user-1', anonymous_id: 'anon-1', email: 'kj@example.com' },
            custom_properties: { segment_library: LIBRARY },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })

    it('sends only the track event for an anonymous user (no profile update)', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Viewed',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {}
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Viewed',
            user_identifier: { anonymous_id: 'anon-1' },
            custom_properties: { segment_library: LIBRARY },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })

    it('flattens nested event properties into dot-delimited strings', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {},
        properties: { order: { total: 42, currency: 'USD' }, count: 3 }
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Purchase',
            user_identifier: { anonymous_id: 'anon-1' },
            custom_properties: {
              segment_library: LIBRARY,
              'order.total': '42',
              'order.currency': 'USD',
              count: '3'
            },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })

    it('stringifies nested objects and arrays when mode is "stringify"', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {},
        properties: { order: { total: 42, currency: 'USD' }, foods: ['cheese', 'beer'], count: 3 }
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        useDefaultMappings: true,
        mapping: { nested_properties_mode: 'stringify' },
        settings: { appId: APP_ID }
      })

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Purchase',
            user_identifier: { anonymous_id: 'anon-1' },
            custom_properties: {
              segment_library: LIBRARY,
              order: '{"total":42,"currency":"USD"}',
              foods: '["cheese","beer"]',
              count: '3'
            },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })

    it('drops nested objects and arrays when mode is "drop"', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {},
        properties: { order: { total: 42, currency: 'USD' }, foods: ['cheese', 'beer'], count: 3 }
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        useDefaultMappings: true,
        mapping: { nested_properties_mode: 'drop' },
        settings: { appId: APP_ID }
      })

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Purchase',
            user_identifier: { anonymous_id: 'anon-1' },
            custom_properties: {
              segment_library: LIBRARY,
              count: '3'
            },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })

    it('accepts "0" as a valid identity', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: '0',
        anonymousId: null,
        messageId: 'msg-12345678',
        timestamp,
        context: {}
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Purchase',
            user_identifier: { identity: '0' },
            custom_properties: { segment_library: LIBRARY },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })
  })

  describe('page calls', () => {
    it('sends a page call as a "Page viewed" track event', async () => {
      const event = createTestEvent({
        type: 'page',
        event: undefined,
        name: 'Home',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {}
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Page viewed',
            user_identifier: { anonymous_id: 'anon-1' },
            custom_properties: { segment_library: LIBRARY, name: 'Home' },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })
  })

  describe('screen calls', () => {
    it('sends a screen call as a "Screen viewed" track event', async () => {
      const event = createTestEvent({
        type: 'screen',
        event: undefined,
        name: 'Dashboard',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {}
      })

      const track = capture(US_URL, TRACK_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Screen viewed',
            user_identifier: { anonymous_id: 'anon-1' },
            custom_properties: { segment_library: LIBRARY, name: 'Dashboard' },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })
  })

  describe('identify calls', () => {
    it('updates user properties only (no track event)', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-1',
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        traits: { name: 'Katherine Johnson', plan: 'pro' }
      })

      const profile = capture(US_URL, ADD_USER_PROPERTIES_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(profile.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        users: [
          {
            user_identifier: { identity: 'user-1' },
            custom_properties: { name: 'Katherine Johnson', plan: 'pro' }
          }
        ]
      })
    })

    it('stringifies nested user properties when mode is "stringify"', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-1',
        anonymousId: null,
        messageId: 'msg-12345678',
        timestamp,
        traits: { name: 'Katherine Johnson', address: { city: 'Hampton', zip: '23666' } }
      })

      const profile = capture(US_URL, ADD_USER_PROPERTIES_URI)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        useDefaultMappings: true,
        mapping: { nested_properties_mode: 'stringify' },
        settings: { appId: APP_ID }
      })

      expect(responses.length).toBe(1)
      expect(profile.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        users: [
          {
            user_identifier: { identity: 'user-1' },
            custom_properties: {
              name: 'Katherine Johnson',
              address: '{"city":"Hampton","zip":"23666"}'
            }
          }
        ]
      })
    })

    it('preserves number, boolean and null user property values', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-1',
        anonymousId: null,
        messageId: 'msg-12345678',
        timestamp,
        traits: { plan: 'pro', age: 34, active: true, nickname: null }
      })

      const profile = capture(US_URL, ADD_USER_PROPERTIES_URI)

      const responses = await run(event)

      expect(responses.length).toBe(1)
      expect(profile.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        users: [
          {
            user_identifier: { identity: 'user-1' },
            custom_properties: { plan: 'pro', age: 34, active: true, nickname: null }
          }
        ]
      })
    })
  })

  describe('EU region', () => {
    it('routes both calls to the EU endpoint', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: 'user-1',
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: { traits: { name: 'Katherine Johnson' } }
      })

      const profile = capture(EU_URL, ADD_USER_PROPERTIES_URI)
      const track = capture(EU_URL, TRACK_URI)

      const responses = await run(event, 'EU')

      expect(responses.length).toBe(2)
      expect(profile.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        users: [
          {
            user_identifier: { identity: 'user-1' },
            custom_properties: { name: 'Katherine Johnson' }
          }
        ]
      })
      expect(track.value).toStrictEqual({
        app_id: APP_ID,
        library: 'server',
        events: [
          {
            event: 'Purchase',
            user_identifier: { identity: 'user-1', anonymous_id: 'anon-1' },
            custom_properties: { segment_library: LIBRARY },
            idempotency_key: 'msg-12345678',
            timestamp
          }
        ]
      })
    })
  })

  describe('failure scenarios', () => {
    it('throws when the event has no user identifier (track)', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: null,
        anonymousId: null,
        messageId: 'msg-12345678',
        timestamp,
        context: {}
      })

      await expect(run(event)).rejects.toThrow('At least one of Identity, Anonymous ID, User ID or Email is required.')
    })

    it('throws when an identify call has no identity', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        traits: { plan: 'pro' }
      })

      await expect(run(event)).rejects.toThrow('Identity is required for identify calls.')
    })

    it('throws when user properties are provided without an identity', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: { traits: { plan: 'pro' } }
      })

      await expect(run(event)).rejects.toThrow('Identity is required when User Properties are provided.')
    })

    it('propagates an HTTP error returned by Heap', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Purchase',
        userId: null,
        anonymousId: 'anon-1',
        messageId: 'msg-12345678',
        timestamp,
        context: {}
      })

      nock(US_URL).post(TRACK_URI).reply(500, {})

      await expect(run(event)).rejects.toThrow()
    })
  })
})
