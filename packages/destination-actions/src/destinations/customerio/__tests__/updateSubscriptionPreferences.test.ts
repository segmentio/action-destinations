import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'
import dayjs from '../../../lib/dayjs'
import destination from '../index'
import { AccountRegion } from '../utils'

const EVENT_NAME = 'Subscription Preferences Updated'

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
            topics: { topic_1: true, topic_2: false }
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          useDefaultMappings: true
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
          useDefaultMappings: true
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
          useDefaultMappings: true
        })

        expect(response.attributes).toEqual({ unsubscribed: false })
      })

      it('should send topics, channels and unsubscribed together', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            topics: { topic_3: true },
            channels: { sms: false, email: true },
            unsubscribed: false
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response.attributes).toEqual({
          'cio_subscription_preferences.topics.topic_3': true,
          'cio_subscription_preferences.channels.sms': false,
          'cio_subscription_preferences.channels.email': true,
          unsubscribed: false
        })
      })

      it('should normalize numeric topic ids and boolean strings, and drop non-boolean values', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          anonymousId: undefined,
          properties: {
            topics: { '4': 'true', topic_5: 'FALSE', topic_6: 'maybe', topic_7: null }
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response.attributes).toEqual({
          'cio_subscription_preferences.topics.topic_4': true,
          'cio_subscription_preferences.topics.topic_5': false
        })
      })

      it('should identify by email when there is no user id', async () => {
        const email = 'foo@bar.com'
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: undefined,
          anonymousId: undefined,
          properties: {
            email,
            topics: { topic_1: false }
          }
        })

        const response = await action('updateSubscriptionPreferences', {
          event,
          settings,
          useDefaultMappings: true
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
          useDefaultMappings: true
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
          useDefaultMappings: true
        })

        expect(response.identifiers).toEqual({ anonymous_id: 'anon123' })
        expect(response.attributes).toEqual({ unsubscribed: true })
      })

      it('should reject topic keys that are not topic_<id>', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          properties: {
            topics: { topic_1: true, newsletter: true, 'topic-2': false }
          }
        })

        await expect(
          action('updateSubscriptionPreferences', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).rejects.toThrow('Invalid keys: newsletter, topic-2.')
      })

      it('should reject events without any preference to update', async () => {
        const event = createTestEvent({
          event: EVENT_NAME,
          userId: 'abc123',
          properties: {
            topics: {}
          }
        })

        await expect(
          action('updateSubscriptionPreferences', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).rejects.toThrow('At least one of Topic Preferences, Channel Preferences, or Globally Unsubscribed')
      })
    })
  })

  describe('updateSubscriptionPreferences batch', () => {
    it('drops payloads with invalid topic keys and sends the rest', async () => {
      const testDestination = createTestIntegration(destination)
      const settings: Settings = { siteId: '12345', apiKey: 'abcde', accountRegion: AccountRegion.US }
      let body: { batch: Array<Record<string, unknown>> } | undefined
      nock('https://track.customer.io')
        .post('/api/v2/batch', (requestBody) => {
          body = requestBody
          return true
        })
        .reply(200, {})

      const events = [
        createTestEvent({ event: EVENT_NAME, userId: 'valid', properties: { topics: { topic_1: true } } }),
        createTestEvent({ event: EVENT_NAME, userId: 'invalid', properties: { topics: { newsletter: true } } })
      ]

      const responses = await testDestination.testBatchAction('updateSubscriptionPreferences', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(200)
      expect(body?.batch).toHaveLength(1)
      expect(body?.batch[0]).toMatchObject({
        identifiers: { id: 'valid' },
        attributes: { 'cio_subscription_preferences.topics.topic_1': true }
      })
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
