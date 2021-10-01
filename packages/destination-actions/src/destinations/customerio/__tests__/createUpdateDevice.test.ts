import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'

const testDestination = createTestIntegration(CustomerIO)
const trackService = nock('https://track.customer.io/api/v1')

describe('CustomerIO', () => {
  describe('createUpdateDevice', () => {
    it('should work with default mappings when userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      const deviceType = 'ios'
      const timestamp = dayjs.utc().toISOString()
      trackService.put(`/customers/${userId}/devices`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        timestamp,
        context: {
          device: {
            id: deviceId,
            type: deviceType
          }
        }
      })
      const responses = await testDestination.testAction('createUpdateDevice', {
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
        device: {
          id: deviceId,
          platform: deviceType,
          last_used: dayjs.utc(timestamp).unix()
        }
      })
    })

    it('should not convert last_used to a unix timestamp when convert_timestamp is false', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      const deviceType = 'ios'
      const timestamp = dayjs.utc().toISOString()
      trackService.put(`/customers/${userId}/devices`).reply(200, {})
      const event = createTestEvent({
        userId,
        timestamp,
        context: {
          device: {
            id: deviceId,
            type: deviceType
          }
        }
      })
      const responses = await testDestination.testAction('createUpdateDevice', {
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
        device: {
          id: deviceId,
          platform: deviceType,
          last_used: timestamp
        }
      })
    })

    it('should work with the EU account region', async () => {
      const trackEUService = nock('https://track-eu.customer.io/api/v1')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track-eu.customer.io'
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      const deviceType = 'ios'
      const timestamp = dayjs.utc().toISOString()
      trackEUService.put(`/customers/${userId}/devices`).reply(200, {}, { 'x-customerio-region': 'EU' })
      const event = createTestEvent({
        userId,
        timestamp,
        context: {
          device: {
            id: deviceId,
            type: deviceType
          }
        }
      })
      const responses = await testDestination.testAction('createUpdateDevice', {
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
        device: {
          id: deviceId,
          platform: deviceType,
          last_used: dayjs.utc(timestamp).unix()
        }
      })
    })

    it('should fall back to the US account region', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde'
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      const deviceType = 'ios'
      const timestamp = dayjs.utc().toISOString()
      trackService.put(`/customers/${userId}/devices`).reply(200, {}, { 'x-customerio-region': 'US-fallback' })
      const event = createTestEvent({
        userId,
        timestamp,
        context: {
          device: {
            id: deviceId,
            type: deviceType
          }
        }
      })
      const responses = await testDestination.testAction('createUpdateDevice', {
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
        device: {
          id: deviceId,
          platform: deviceType,
          last_used: dayjs.utc(timestamp).unix()
        }
      })
    })
  })
})
