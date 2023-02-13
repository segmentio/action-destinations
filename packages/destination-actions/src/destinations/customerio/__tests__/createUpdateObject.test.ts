import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { AccountRegion } from '../utils'

const testDestination = createTestIntegration(CustomerIO)
const trackObjectService = nock('https://track.customer.io')

describe('CustomerIO', () => {
  describe('createUpdateObject', () => {
    it('should work with default mappings when userId is supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const groupId = 'grp123'
      const traits = {
        name: 'Sales',
        industry: 'Technology',
        created_at: timestamp,
        object_type_id: '1'
      }

      const attributes = {
        name: 'Sales',
        industry: 'Technology',
        created_at: dayjs.utc(timestamp).unix(),
        object_type_id: '1'
      }
      trackObjectService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits,
        groupId
      })
      const responses = await testDestination.testAction('createUpdateObject', {
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
        attributes: attributes,
        created_at: dayjs.utc(timestamp).unix(),
        type: 'object',
        action: 'identify',
        identifiers: {
          object_type_id: traits.object_type_id,
          object_id: groupId
        },
        cio_relationships: [{ identifiers: { id: userId } }]
      })
    })

    it('should work with the EU account region', async () => {
      const trackEUObjectService = nock('https://track-eu.customer.io')
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.EU
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const groupId = 'grp123'
      const traits = {
        name: 'Sales',
        industry: 'Technology',
        created_at: timestamp,
        object_type_id: '1'
      }
      const attributes = {
        name: 'Sales',
        industry: 'Technology',
        created_at: dayjs.utc(timestamp).unix(),
        object_type_id: '1'
      }
      trackEUObjectService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'EU' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits,
        groupId
      })
      const responses = await testDestination.testAction('createUpdateObject', {
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
        attributes: attributes,
        created_at: dayjs.utc(timestamp).unix(),
        type: 'object',
        action: 'identify',
        identifiers: {
          object_type_id: traits.object_type_id,
          object_id: groupId
        },
        cio_relationships: [{ identifiers: { id: userId } }]
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
      const groupId = 'grp123'
      const traits = {
        name: 'Sales',
        industry: 'Technology',
        created_at: timestamp,
        object_type_id: '1'
      }
      const attributes = {
        name: 'Sales',
        industry: 'Technology',
        created_at: dayjs.utc(timestamp).unix(),
        object_type_id: '1'
      }
      trackObjectService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'US-fallback' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits,
        groupId
      })
      const responses = await testDestination.testAction('createUpdateObject', {
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
        attributes: attributes,
        created_at: dayjs.utc(timestamp).unix(),
        type: 'object',
        action: 'identify',
        identifiers: {
          object_type_id: traits.object_type_id,
          object_id: groupId
        },
        cio_relationships: [{ identifiers: { id: userId } }]
      })
    })

    it('should work with anonymous id when userId is not supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const groupId = 'grp123'
      const traits = {
        name: 'Sales',
        created_at: timestamp,
        object_type_id: '1'
      }

      const attributes = {
        name: 'Sales',
        created_at: dayjs.utc(timestamp).unix(),
        object_type_id: '1'
      }
      trackObjectService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId: undefined,
        anonymousId,
        timestamp,
        traits,
        groupId
      })
      const responses = await testDestination.testAction('createUpdateObject', {
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
        attributes: attributes,
        created_at: dayjs.utc(timestamp).unix(),
        type: 'object',
        action: 'identify_anonymous',
        identifiers: {
          object_type_id: traits.object_type_id,
          object_id: groupId
        },
        cio_relationships: [{ identifiers: { anonymous_id: anonymousId } }]
      })
    })

    it('should work with default object_type_id when object_type_id is not supplied', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const groupId = 'grp123'
      const traits = {
        name: 'Sales',
        created_at: timestamp
      }

      const attributes = {
        name: 'Sales',
        created_at: dayjs.utc(timestamp).unix()
      }
      trackObjectService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits,
        groupId
      })
      const responses = await testDestination.testAction('createUpdateObject', {
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
        attributes: attributes,
        created_at: dayjs.utc(timestamp).unix(),
        type: 'object',
        action: 'identify',
        identifiers: {
          object_type_id: '1',
          object_id: groupId
        },
        cio_relationships: [{ identifiers: { id: userId } }]
      })
    })

    it('should work when no created_at is given', async () => {
      const settings: Settings = {
        siteId: '12345',
        apiKey: 'abcde',
        accountRegion: AccountRegion.US
      }
      const userId = 'abc123'
      const anonymousId = 'unknown_123'
      const timestamp = dayjs.utc().toISOString()
      const groupId = 'grp123'
      const typeId = '1'
      const traits = {
        name: 'Sales',
        object_type_id: '1'
      }
      trackObjectService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'US' })
      const event = createTestEvent({
        userId,
        anonymousId,
        timestamp,
        traits,
        groupId
      })
      const responses = await testDestination.testAction('createUpdateObject', {
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
        attributes: traits,
        type: 'object',
        action: 'identify',
        identifiers: {
          object_type_id: typeId,
          object_id: groupId
        },
        cio_relationships: [{ identifiers: { id: userId } }]
      })
    })
  })
})
