import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'

const testDestination = createTestIntegration(CustomerIO)
const trackDeviceService = nock('https://track.customer.io/api/v1')

describe('CustomerIO', () => {
  describe('createUpdatePerson', () => {
    it('should work with default mappings when userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const traits = {
        full_name: 'Test User',
        userId: 'test@example.com'
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        ...traits,
        email: traits.userId,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId
      })
    })

    it('should not convert created_at to a unix timestamp when convert_timestamp is false', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const traits = {
        full_name: 'Test User',
        userId: 'test@example.com'
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {})
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        mapping: {
          convert_timestamp: false
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        ...traits,
        email: traits.userId,
        created_at: timestamp,
        anonymous_id: anonymousId
      })
    })

    it('should work with the EU account region', async () => {
      const trackEUDeviceService = nock('https://track-eu.customer.io/api/v1')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track-eu.customer.io'
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const traits = {
        full_name: 'Test User',
        userId: 'test@example.com'
      }
      trackEUDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'EU' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'EU',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        ...traits,
        email: traits.userId,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId
      })
    })

    it('should fall back to the US account region', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde'
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const traits = {
        full_name: 'Test User',
        userId: 'test@example.com'
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'US-fallback' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US-fallback',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        ...traits,
        email: traits.userId,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId
      })
    })
  })
})
