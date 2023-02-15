import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { AccountRegion } from '../utils'

const testDestination = createTestIntegration(CustomerIO)
const trackDeviceService = nock('https://track.customer.io/api/v1')

describe('CustomerIO', () => {
  describe('createUpdatePerson', () => {
    it('should work with default mappings when userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
      const traits = {
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: timestamp,
        person: {
          over18: true,
          identification: 'valid',
          birthdate
        }
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
        email: traits.email,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId,
        person: {
          ...traits.person,
          birthdate: dayjs.utc(birthdate).unix()
        }
      })
    })

    it('should use email as the identifier if userId is not present', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
      const traits = {
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: timestamp,
        person: {
          over18: true,
          identification: 'valid',
          birthdate
        }
      }
      trackDeviceService.put(`/customers/${traits.email}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId: null,
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
        email: traits.email,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId,
        person: {
          ...traits.person,
          birthdate: dayjs.utc(birthdate).unix()
        }
      })
    })

    it('should convert only ISO-8601 strings', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const timestamp = dayjs.utc().toISOString()
      const testTimestamps = {
        created_at: timestamp,
        date01: '25 Mar 2015',
        date02: 'Mar 25 2015',
        date03: '01/01/2019',
        date04: '2019-02-01',
        date05: '2007-01-02T18:04:07',
        date06: '2006-01-02T18:04:07Z',
        date07: '2006-01-02T18:04:07+01:00',
        date08: '2006-01-02T15:04:05.007',
        date09: '2006-01-02T15:04:05.007Z',
        date10: '2006-01-02T15:04:05.007+01:00',
        date11: '2018-03-04T12:08:56 PDT',
        date12: '2018-03-04T12:08:56.235 PDT',
        date13: '15/MAR/18',
        date14: '11-Jan-18',
        date15: '2006-01-02T15:04:05-0800',
        date16: '2006-01-02T15:04:05.07-0800',
        date17: '2006-01-02T15:04:05.007-0800'
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        timestamp,
        traits: testTimestamps
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        created_at: dayjs(timestamp).unix(),
        date01: testTimestamps.date01,
        date02: testTimestamps.date02,
        date03: testTimestamps.date03,
        date04: dayjs(testTimestamps.date04).unix(),
        date05: dayjs(testTimestamps.date05).unix(),
        date06: dayjs(testTimestamps.date06).unix(),
        date07: dayjs(testTimestamps.date07).unix(),
        date08: dayjs(testTimestamps.date08).unix(),
        date09: dayjs(testTimestamps.date09).unix(),
        date10: dayjs(testTimestamps.date10).unix(),
        date11: testTimestamps.date11,
        date12: testTimestamps.date12,
        date13: testTimestamps.date13,
        date14: testTimestamps.date14,
        date15: dayjs(testTimestamps.date15).unix(),
        date16: dayjs(testTimestamps.date16).unix(),
        date17: dayjs(testTimestamps.date17).unix()
      })
    })

    it("should not convert created_at if it's invalid", async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const timestamp = dayjs.utc().toISOString()
      const testTimestamps = {
        created_at: '2018-03-04T12:08:56.235 PDT'
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        timestamp,
        traits: testTimestamps
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        created_at: testTimestamps.created_at
      })
    })

    it("should not convert created_at if it's already a number", async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const timestamp = dayjs.utc().toISOString()
      const testTimestamps = {
        created_at: dayjs.utc(timestamp).unix().toString()
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        timestamp,
        traits: testTimestamps
      })
      const responses = await testDestination.testAction('createUpdatePerson', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        created_at: testTimestamps.created_at
      })
    })

    it('should not convert attributes to unix timestamps when convert_timestamp is false', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
      const traits = {
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: timestamp,
        person: {
          over18: true,
          identification: 'valid',
          birthdate
        }
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
        email: traits.email,
        created_at: timestamp,
        anonymous_id: anonymousId
      })
    })

    it("should not add created_at if it's not a trait", async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const traits = {
        full_name: 'Test User',
        email: 'test@example.com'
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
        email: traits.email,
        anonymous_id: anonymousId
      })
    })

    it('should work with the EU account region', async () => {
      const trackEUDeviceService = nock('https://track-eu.customer.io/api/v1')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.EU
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const traits = {
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: timestamp
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
        email: traits.email,
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
        email: 'test@example.com',
        created_at: timestamp
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
        email: traits.email,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId
      })
    })

    it('should work with default mappings when userId and groupId are supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
      const groupId = 'g12345'
      const traits = {
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: timestamp,
        person: {
          over18: true,
          identification: 'valid',
          birthdate
        }
      }
      const context = {
        groupId: groupId
      }
      trackDeviceService.put(`/customers/${userId}`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits,
        context
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
        email: traits.email,
        created_at: dayjs.utc(timestamp).unix(),
        anonymous_id: anonymousId,
        person: {
          ...traits.person,
          birthdate: dayjs.utc(birthdate).unix()
        },
        cio_relationships: {
          action: 'add_relationships',
          relationships: [{ identifiers: { object_type_id: '1', object_id: groupId } }]
        }
      })
    })
  })
})
