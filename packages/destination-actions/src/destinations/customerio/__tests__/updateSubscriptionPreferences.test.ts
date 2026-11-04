import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { getDefaultMappings, testRunner } from '../test-helper'
import dayjs from '../../../lib/dayjs'
import destination from '../index'
import { AccountRegion } from '../utils'

const EVENT_NAME = 'Subscription Preferences Updated'

// `topics` and `channels` have no default mapping (the array editor starts empty in the UI), so these tests use the
// mapping a user would configure: the defaults for every other field plus an @arrayPath for each list.
const mapping = {
  ...getDefaultMappings('updateSubscriptionPreferences'),
  topics: {
    '@arrayPath': [
      '$.properties.topics',
      { topic_id: { '@path': '$.topic_id' }, subscribed: { '@path': '$.subscribed' } }
    ]
  },
  channels: {
    '@arrayPath': [
      '$.properties.channels',
      { channel_type: { '@path': '$.channel_type' }, subscribed: { '@path': '$.subscribed' } }
    ]
  }
}

describe('CustomerIO', () => {
  describe('updateSubscriptionPreferences', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should send topic preferences as dot-notated attributes', async () => {
        const timestamp = dayjs.utc().toISOString()
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: 'anon123',
          timestamp,
          properties: {
            topics: [
              { topic_id: 1, subscribed: true },
              { topic_id: 2, subscribed: false }
            ]
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response).toEqual({
          action: 'identify',
          type: 'person',
          identifiers: { id: 'abc123' },
          timestamp: dayjs.utc(timestamp).unix(),
          attributes: {
            anonymous_id: 'anon123',
            'cio_subscription_preferences.topics.topic_1': true,
            'cio_subscription_preferences.topics.topic_2': false
          }
        })
        expect(response.attributes).not.toHaveProperty('unsubscribed')
        expect(response.attributes).not.toHaveProperty('cio_subscription_preferences')
      })

      it('should not map topics or channels with the default mappings', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            topics: [{ topic_id: 1, subscribed: true }],
            channels: [{ channel_type: 'email', subscribed: true }],
            unsubscribed: false
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response.attributes).toEqual({ unsubscribed: false })
      })

      it('should send only the unsubscribed attribute when no topics are provided', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            unsubscribed: true
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response).toMatchObject({
          action: 'identify',
          type: 'person',
          identifiers: { id: 'abc123' }
        })
        expect(response.attributes).toEqual({ unsubscribed: true })
      })

      it('should send unsubscribed = false to resubscribe a person', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            unsubscribed: false
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response.attributes).toEqual({ unsubscribed: false })
      })

      it('should send topics, channels and unsubscribed together', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            topics: [{ topic_id: 3, subscribed: true }],
            channels: [
              { channel_type: 'sms', subscribed: false },
              { channel_type: 'email', subscribed: true }
            ],
            unsubscribed: false
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response.attributes).toEqual({
          'cio_subscription_preferences.topics.topic_3': true,
          'cio_subscription_preferences.channels.sms': false,
          'cio_subscription_preferences.channels.email': true,
          unsubscribed: false
        })
      })

      it('should accept topics and channels mapped explicitly rather than through @arrayPath', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            subscriptions: { newsletter: false, sms_marketing: true }
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping: {
            id: { '@path': '$.userId' },
            topics: [{ topic_id: 4, subscribed: { '@path': '$.properties.subscriptions.newsletter' } }],
            channels: [{ channel_type: 'sms', subscribed: { '@path': '$.properties.subscriptions.sms_marketing' } }]
          }
        })

        expect(response.attributes).toEqual({
          'cio_subscription_preferences.topics.topic_4': false,
          'cio_subscription_preferences.channels.sms': true
        })
      })

      it.each([
        ['a string', 'topic_1'],
        ['a float', 1.5]
      ])('should reject a topic id that is %s', async (_label, topic_id) => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          properties: {
            topics: [{ topic_id, subscribed: true }]
          }
        })

        await expect(action('updateSubscriptionPreferences', { event, settings, mapping })).rejects.toThrow()
      })

      // The framework applies `minimum` to `number` fields only, so a non-positive integer passes field validation.
      // It is sent as written and Customer.io discards the unknown topic without an error.
      it.each([0, -1])(
        'should pass a non-positive topic id (%s) through for Customer.io to discard',
        async (topic_id) => {
          const event = createTestEvent({
            event: EVENT_NAME,
            userId: 'abc123',
            anonymousId: undefined,
            properties: {
              topics: [{ topic_id, subscribed: true }]
            }
          })

          const response = await action('updateSubscriptionPreferences', { event, settings, mapping })

          expect(response.attributes).toEqual({ [`cio_subscription_preferences.topics.topic_${topic_id}`]: true })
        }
      )

      it('should reject a channel type that is not a Customer.io channel', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          properties: {
            channels: [{ channel_type: 'fax', subscribed: true }]
          }
        })

        await expect(action('updateSubscriptionPreferences', { event, settings, mapping })).rejects.toThrow()
      })

      it('should reject a non-boolean subscribed value', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          properties: {
            topics: [{ topic_id: 1, subscribed: 'yes' }]
          }
        })

        await expect(action('updateSubscriptionPreferences', { event, settings, mapping })).rejects.toThrow()
      })

      it('should identify by user id when both a user id and an email are present', async () => {
        const email = 'both@bar.com'
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          context: { traits: { email } },
          properties: {
            email,
            topics: [{ topic_id: 1, subscribed: true }]
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response.identifiers).toEqual({ id: 'abc123' })
        expect(response.attributes).toEqual({ 'cio_subscription_preferences.topics.topic_1': true })
      })

      it('should identify by email when there is no user id', async () => {
        const email = 'foo@bar.com'
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: undefined,
          anonymousId: undefined,
          properties: {
            email,
            topics: [{ topic_id: 1, subscribed: false }]
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response.identifiers).toEqual({ email })
        expect(response.attributes).toEqual({ 'cio_subscription_preferences.topics.topic_1': false })
      })

      it('should fall back to context.traits.email when properties.email is missing', async () => {
        const email = 'traits@bar.com'
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: undefined,
          anonymousId: undefined,
          context: { traits: { email } },
          properties: {
            unsubscribed: true
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response.identifiers).toEqual({ email })
      })

      it('should identify by anonymous id when there is no user id or email', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: undefined,
          anonymousId: 'anon123',
          properties: {
            unsubscribed: true
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })

        expect(response.identifiers).toEqual({ anonymous_id: 'anon123' })
        expect(response.attributes).toEqual({ unsubscribed: true })
      })
    })
  })

  describe('updateSubscriptionPreferences single request', () => {
    const testDestination = createTestIntegration(destination)
    const settings: Settings = { siteId: '12345', apiKey: 'abcde', accountRegion: AccountRegion.US }

    it('should reject events without any preference to update', async () => {
      const event = createTestEvent({
        event: EVENT_NAME,
        userId: 'abc123',
        properties: {
          topics: [],
          channels: []
        }
      })

      await expect(
        testDestination.testAction('updateSubscriptionPreferences', {
          event,
          settings,
          mapping
        })
      ).rejects.toThrow('At least one of Topic Preferences, Channel Preferences, or Globally Unsubscribed')
    })
  })

  describe('updateSubscriptionPreferences batch', () => {
    const testDestination = createTestIntegration(destination)
    const settings: Settings = { siteId: '12345', apiKey: 'abcde', accountRegion: AccountRegion.US }

    afterEach(() => {
      nock.cleanAll()
    })

    it('reports invalid items individually and sends the valid ones', async () => {
      let body: { batch: Array<Record<string, unknown>> } | undefined
      nock('https://track.customer.io')
        .post('/api/v2/batch', (requestBody) => {
          body = requestBody
          return true
        })
        .reply(200, {})

      const events = [
        createTestEvent({
          event: EVENT_NAME,
          userId: 'valid',
          properties: { topics: [{ topic_id: 1, subscribed: true }] }
        }),
        createTestEvent({
          event: EVENT_NAME,
          userId: 'bad-topic',
          properties: { topics: [{ topic_id: 'newsletter', subscribed: true }] }
        }),
        createTestEvent({
          event: EVENT_NAME,
          userId: 'bad-channel',
          properties: { channels: [{ channel_type: 'fax', subscribed: true }] }
        }),
        createTestEvent({
          event: EVENT_NAME,
          userId: 'bad-boolean',
          properties: { topics: [{ topic_id: 1, subscribed: 'yes' }] }
        })
      ]

      const results = await testDestination.executeBatch('updateSubscriptionPreferences', {
        events,
        settings,
        mapping
      })

      expect(results.map((result) => result.status)).toEqual([200, 400, 400, 400])
      expect(results[1]).toMatchObject({ errortype: 'PAYLOAD_VALIDATION_FAILED' })
      expect(results[2]).toMatchObject({ errortype: 'PAYLOAD_VALIDATION_FAILED' })
      expect(results[3]).toMatchObject({ errortype: 'PAYLOAD_VALIDATION_FAILED' })
      expect(body?.batch).toHaveLength(1)
      expect(body?.batch[0]).toMatchObject({
        identifiers: { id: 'valid' },
        attributes: { 'cio_subscription_preferences.topics.topic_1': true }
      })
    })

    it('sends an item without identifiers unchanged, for Customer.io to reject', async () => {
      // Per-item identifier validation for batches arrives with the MultiStatus batch handling; until then the
      // item is passed through and Customer.io reports the failure in its 207 response.
      let body: { batch: Array<Record<string, unknown>> } | undefined
      nock('https://track.customer.io')
        .post('/api/v2/batch', (requestBody) => {
          body = requestBody
          return true
        })
        .reply(200, {})

      const events = [
        createTestEvent({
          event: EVENT_NAME,
          userId: undefined,
          anonymousId: undefined,
          properties: { unsubscribed: true }
        }),
        createTestEvent({
          event: EVENT_NAME,
          userId: 'valid',
          anonymousId: undefined,
          properties: { unsubscribed: true }
        })
      ]

      await testDestination.executeBatch('updateSubscriptionPreferences', {
        events,
        settings,
        mapping
      })

      expect(body?.batch).toHaveLength(2)
      expect(body?.batch[0]).not.toHaveProperty('identifiers')
      expect(body?.batch[0]).toMatchObject({ attributes: { unsubscribed: true } })
      expect(body?.batch[1]).toMatchObject({ identifiers: { id: 'valid' } })
    })

    it('sends an item with no preferences as an identify with no attribute changes', async () => {
      let body: { batch: Array<Record<string, unknown>> } | undefined
      nock('https://track.customer.io')
        .post('/api/v2/batch', (requestBody) => {
          body = requestBody
          return true
        })
        .reply(200, {})

      const events = [
        createTestEvent({ event: EVENT_NAME, userId: 'empty', anonymousId: undefined, properties: {} }),
        createTestEvent({
          event: EVENT_NAME,
          userId: 'valid',
          anonymousId: undefined,
          properties: { unsubscribed: true }
        })
      ]

      const results = await testDestination.executeBatch('updateSubscriptionPreferences', {
        events,
        settings,
        mapping
      })

      expect(results.map((result) => result.status)).toEqual([200, 200])
      expect(body?.batch).toHaveLength(2)
      expect(body?.batch[0]).toMatchObject({ identifiers: { id: 'empty' }, attributes: {} })
      expect(body?.batch[1]).toMatchObject({ identifiers: { id: 'valid' }, attributes: { unsubscribed: true } })
    })

    it('does not send a request when every item is invalid', async () => {
      const scope = nock('https://track.customer.io').post('/api/v2/batch').reply(200, {})

      const events = [
        createTestEvent({
          event: EVENT_NAME,
          userId: 'a',
          properties: { topics: [{ topic_id: 'one', subscribed: true }] }
        }),
        createTestEvent({
          event: EVENT_NAME,
          userId: 'b',
          properties: { topics: [{ topic_id: 1, subscribed: 'yes' }] }
        })
      ]

      const results = await testDestination.executeBatch('updateSubscriptionPreferences', {
        events,
        settings,
        mapping
      })

      expect(results.map((result) => result.status)).toEqual([400, 400])
      expect(scope.isDone()).toBe(false)
    })
  })

  describe('Update Subscription Preferences preset', () => {
    it('subscribes to the Subscription Preferences Updated event', () => {
      const preset = destination.presets?.find((candidate) => candidate.name === 'Update Subscription Preferences')

      expect(preset).toMatchObject({
        subscribe: `event = "${EVENT_NAME}"`,
        partnerAction: 'updateSubscriptionPreferences',
        type: 'automatic'
      })
      expect(destination.actions.updateSubscriptionPreferences.defaultSubscription).toBe(`event = "${EVENT_NAME}"`)
    })

    it('is excluded from the Track Event preset and default subscription', () => {
      const trackPreset = destination.presets?.find((candidate) => candidate.name === 'Track Event')

      expect(trackPreset?.subscribe).toContain(`event != "${EVENT_NAME}"`)
      expect(destination.actions.trackEvent.defaultSubscription).toContain(`event != "${EVENT_NAME}"`)
    })
  })
})
