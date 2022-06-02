import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { AccountRegion } from '../utils'

const testDestination = createTestIntegration(CustomerIO)
const trackPageViewService = nock('https://track.customer.io/api/v1')
const type = 'page'

describe('CustomerIO', () => {
  describe('trackPageView', () => {
    it('should work with default mappings when a userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const url = 'https://example.com/page-one'
      const timestamp = dayjs.utc().toISOString()
      const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
      const data = {
        property1: 'this is a test',
        url,
        person: {
          over18: true,
          identification: 'valid',
          birthdate
        }
      }
      trackPageViewService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        properties: data,
        timestamp
      })
      const responses = await testDestination.testAction('trackPageView', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name: url,
        type,
        timestamp: dayjs.utc(timestamp).unix(),
        data: {
          ...data,
          person: {
            ...data.person,
            birthdate: dayjs.utc(birthdate).unix()
          }
        }
      })
    })

    it('should work with default mappings when a anonymousId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const anonymousId = 'anonymous123'
      const url = 'https://example.com/page-one'
      const timestamp = dayjs.utc().toISOString()
      const data = {
        property1: 'this is a test',
        url
      }
      trackPageViewService.post(`/events`).reply(200, {})
      const event = createTestEvent({
        anonymousId,
        properties: data,
        userId: undefined,
        timestamp
      })

      const responses = await testDestination.testAction('trackPageView', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name: url,
        type,
        data,
        anonymous_id: anonymousId,
        timestamp: dayjs.utc(timestamp).unix()
      })
    })

    it('should error when the url field is not supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const timestamp = dayjs.utc().toISOString()
      trackPageViewService.post(`/events`).reply(200, {})
      const event = createTestEvent({
        anonymousId: undefined,
        userId: undefined,
        timestamp
      })

      try {
        await testDestination.testAction('trackPageView', { event, settings, useDefaultMappings: true })
        fail('This test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe("The root value is missing the required field 'url'.")
      }
    })

    it("should not convert timestamp if it's invalid", async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const url = 'https://example.com/page-one'
      const timestamp = '2018-03-04T12:08:56.235 PDT'
      const data = {
        property1: 'this is a test',
        url
      }
      trackPageViewService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        properties: data,
        timestamp
      })
      const responses = await testDestination.testAction('trackPageView', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        name: url,
        type,
        data,
        timestamp
      })
    })

    it('should not convert dates to unix timestamps when convert_timestamp is false', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const url = 'https://example.com/page-one'
      const timestamp = dayjs.utc().toISOString()
      const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
      const data = {
        property1: 'this is a test',
        url,
        person: {
          over18: true,
          identification: 'valid',
          birthdate
        }
      }
      trackPageViewService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        properties: data,
        timestamp
      })
      const responses = await testDestination.testAction('trackPageView', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          convert_timestamp: false
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name: url,
        type,
        data,
        timestamp
      })
    })

    it('should work with the EU account region', async () => {
      const trackEUEventService = nock('https://track-eu.customer.io/api/v1')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.EU
      }
      const userId = 'abc123'
      const url = 'https://example.com/page-one'
      const timestamp = dayjs.utc().toISOString()
      const data = {
        property1: 'this is a test',
        url
      }
      trackEUEventService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'EU' })
      const event = createTestEvent({
        userId,
        timestamp,
        properties: data
      })
      const responses = await testDestination.testAction('trackPageView', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'EU',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name: url,
        type,
        data,
        timestamp: dayjs.utc(timestamp).unix()
      })
    })

    it('should fall back to the US account region', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde'
      }
      const userId = 'abc123'
      const url = 'https://example.com/page-one'
      const timestamp = dayjs.utc().toISOString()
      const data = {
        property1: 'this is a test',
        url
      }
      trackPageViewService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'US-fallback' })
      const event = createTestEvent({
        userId,
        timestamp,
        properties: data
      })
      const responses = await testDestination.testAction('trackPageView', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US-fallback',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name: url,
        type,
        data,
        timestamp: dayjs.utc(timestamp).unix()
      })
    })
  })
})
