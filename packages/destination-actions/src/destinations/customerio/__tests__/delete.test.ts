import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import { AccountRegion } from '../utils'

const testDestination = createTestIntegration(CustomerIO)
const trackService = nock('https://track.customer.io/api/v1')

describe('CustomerIO', () => {
  describe('deleteDevice', () => {
    it('should work with default mappings when userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      trackService.delete(`/customers/${userId}/devices/${deviceId}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        context: {
          device: {
            token: deviceId
          }
        }
      })
      const responses = await testDestination.testAction('deleteDevice', {
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
      expect(responses[0].options.json).toBeUndefined()
    })

    it('should work with the EU account region', async () => {
      const trackEUService = nock('https://track-eu.customer.io/api/v1')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.EU
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      trackEUService.delete(`/customers/${userId}/devices/${deviceId}`).reply(200, {}, { 'x-customerio-region': 'EU' })
      const event = createTestEvent({
        userId,
        context: {
          device: {
            token: deviceId
          }
        }
      })
      const responses = await testDestination.testAction('deleteDevice', {
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
      expect(responses[0].options.json).toBeUndefined()
    })

    it('should fall back to the US account region', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde'
      }
      const userId = 'abc123'
      const deviceId = 'device_123'
      trackService
        .delete(`/customers/${userId}/devices/${deviceId}`)
        .reply(200, {}, { 'x-customerio-region': 'US-fallback' })
      const event = createTestEvent({
        userId,
        context: {
          device: {
            token: deviceId
          }
        }
      })
      const responses = await testDestination.testAction('deleteDevice', {
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
      expect(responses[0].options.json).toBeUndefined()
    })
  })
})
