import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(CustomerIO)
const trackEventService = nock('https://track.customer.io/api/v1')

describe('CustomerIO', () => {
  describe('trackEvent', () => {
    it('should work with default mappings when a userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const userId = 'abc123'
      const name = 'testEvent'
      const type = 'track'
      const data = {
        property1: 'this is a test'
      }
      trackEventService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        event: name,
        type,
        userId,
        properties: data
      })
      const responses = await testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name,
        type,
        data
      })
    })

    it('should work with default mappings when a anonymousId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const anonymousId = 'anonymous123'
      const name = 'test event'
      const type = 'track'
      const data = {
        property1: 'this is a test'
      }
      trackEventService.post(`/events`).reply(200, {})
      const event = createTestEvent({
        event: name,
        type,
        anonymousId,
        properties: data,
        userId: undefined
      })

      const responses = await testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name,
        type,
        data,
        anonymous_id: anonymousId
      })
    })

    it('should error when the name field is not supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track.customer.io'
      }
      const type = 'track'
      const data = {
        property1: 'this is a test'
      }
      trackEventService.post(`/events`).reply(200, {})
      const event = createTestEvent({
        event: undefined,
        type,
        properties: data,
        anonymousId: undefined,
        userId: undefined
      })

      try {
        await testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
        fail('This test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe("The root value is missing the required field 'name'.")
      }
    })

    it('should work with the EU account region', async () => {
      const trackEUEventService = nock('https://track-eu.customer.io/api/v1')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegionEndpoint: 'https://track-eu.customer.io'
      }
      const userId = 'abc123'
      const name = 'testEvent'
      const type = 'track'
      const data = {
        property1: 'this is a test'
      }
      trackEUEventService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'EU' })
      const event = createTestEvent({
        event: name,
        type,
        userId,
        properties: data
      })
      const responses = await testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'EU',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name,
        type,
        data
      })
    })

    it('should fall back to the US account region', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde'
      }
      const userId = 'abc123'
      const name = 'testEvent'
      const type = 'track'
      const data = {
        property1: 'this is a test'
      }
      trackEventService.post(`/customers/${userId}/events`).reply(200, {}, { 'x-customerio-region': 'US-fallback' })
      const event = createTestEvent({
        event: name,
        type,
        userId,
        properties: data
      })
      const responses = await testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].headers.toJSON()).toMatchObject({
        'x-customerio-region': 'US-fallback',
        'content-type': 'application/json'
      })
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.json).toMatchObject({
        name,
        type,
        data
      })
    })
  })
})
