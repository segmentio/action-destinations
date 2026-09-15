import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Airship from '../index'
import { DecoratedResponse } from '@segment/actions-core'

const testDestination = createTestIntegration(Airship)

describe('Airship', () => {
  describe('extendRequest headers', () => {
    it('should set the Segment attribution User-Agent header with the app key', async () => {
      const now = new Date().toISOString()
      const event = createTestEvent({
        userId: 'test-user-rzoj4u7gqw',
        timestamp: now,
        traits: { trait1: 1 }
      })

      nock('https://go.urbanairship.com').post('/api/channels/attributes').reply(200, {})

      const responses = await testDestination.testAction('setAttributes', {
        event,
        useDefaultMappings: true,
        settings: {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'US'
        }
      })
      expect(responses[0].options.headers?.get('user-agent')).toBe('PartnerIntegrations/Segment (bar)')
    })
  })

  describe('setAttribute', () => {
    it('should work for US', async () => {
      const now = new Date().toISOString()
      const event = createTestEvent({
        userId: 'test-user-rzoj4u7gqw',
        timestamp: now,
        traits: {
          trait1: 1,
          trait2: 'test',
          trait3: true,
          birthdate: '2003-02-22T02:42:33.378Z'
        }
      })

      nock('https://go.urbanairship.com').post('/api/channels/attributes').reply(200, {})

      const responses = await testDestination.testAction('setAttributes', {
        event,
        useDefaultMappings: true,
        settings: {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'US'
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
    })
  })
  describe('setAttribute', () => {
    it('should work for EU', async () => {
      const now = new Date().toISOString()
      const event = createTestEvent({
        userId: 'test-user-rzoj4u7gqw',
        timestamp: now,
        traits: {
          trait1: 1,
          trait2: 'test',
          trait3: true,
          birthdate: '2003-02-22T02:42:33.378Z'
        }
      })

      nock('https://go.airship.eu').post('/api/channels/attributes').reply(200, {})

      const responses = await testDestination.testAction('setAttributes', {
        event,
        useDefaultMappings: true,
        settings: {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'EU'
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
    })
  })

  describe('customEvents', () => {
    it('should work', async () => {
      const now = new Date().toISOString()
      const event = createTestEvent({
        userId: 'test-user-rzoj4u7gqw',
        type: 'track',
        timestamp: now,
        properties: {
          foo: 'bar',
          stuff: {
            lots: 'of',
            stuff: true
          }
        }
      })

      nock('https://go.urbanairship.com').post('/api/custom-events').reply(200, {})

      const responses = await testDestination.testAction('customEvents', {
        event,
        useDefaultMappings: true,
        settings: {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'US'
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
    })

    it('should batch events, building each user object independently', async () => {
      const now = new Date().toISOString()

      nock('https://go.urbanairship.com').post('/api/custom-events').reply(200, {})

      const responses = await testDestination.testBatchAction('customEvents', {
        settings: {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'US'
        },
        events: [
          createTestEvent({ type: 'track', timestamp: now, event: 'Event A', userId: 'named-user-1' }),
          createTestEvent({
            type: 'track',
            timestamp: now,
            event: 'Event B',
            userId: undefined,
            properties: { channel_id: 'chan-xyz' },
            context: { device: { type: 'ios' } }
          })
        ],
        mapping: {
          named_user_id: { '@path': '$.userId' },
          channel_id: { '@path': '$.properties.channel_id' },
          channel_type: { '@path': '$.context.device.type' },
          name: { '@path': '$.event' },
          occurred: { '@path': '$.timestamp' },
          enable_batching: true
        }
      })

      expect(responses[0].status).toBe(200)
      const sent = JSON.parse(responses[0].options.body as string)
      expect(sent).toHaveLength(2)
      // Each event resolves its own audience: first a named user, second an iOS channel
      expect(sent[0].user).toEqual({ named_user_id: 'named-user-1' })
      expect(sent[1].user).toEqual({ ios_channel: 'chan-xyz' })
    })
  })

  describe('manageTags', () => {
    it('should work', async () => {
      const event = createTestEvent({
        userId: 'test-user-rzoj4u7gqw',
        traits: {
          trait1: 1,
          trait2: 'test',
          trait3: true,
          birthdate: '2003-02-22T02:42:33.378Z'
        }
      })

      nock('https://go.urbanairship.com').post('/api/named_users/tags').reply(200, {})

      const responses = await testDestination.testAction('manageTags', {
        event,
        useDefaultMappings: true,
        settings: {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'US'
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
    })
  })

  describe('setAttribute with channel_id', () => {
    it('should use channel audience', async () => {
      const now = new Date().toISOString()
      const event = createTestEvent({
        timestamp: now,
        traits: { trait1: 1 }
      })

      nock('https://go.urbanairship.com').post('/api/channels/attributes').reply(200, {})

      const responses = await testDestination.testAction('setAttributes', {
        event,
        settings: { access_token: 'foo', app_key: 'bar', endpoint: 'US' },
        mapping: {
          channel_id: 'chan-abc',
          channel_type: 'email',
          occurred: now,
          attributes: { trait1: 1 }
        }
      })
      expect(responses[0].status).toBe(200)
    })
  })

  describe('customEvents with channel_id', () => {
    it('should use channel audience', async () => {
      const now = new Date().toISOString()
      const event = createTestEvent({ type: 'track', timestamp: now })

      nock('https://go.urbanairship.com').post('/api/custom-events').reply(200, {})

      const responses = await testDestination.testAction('customEvents', {
        event,
        settings: { access_token: 'foo', app_key: 'bar', endpoint: 'US' },
        mapping: {
          channel_id: 'chan-abc',
          channel_type: 'email',
          name: 'Test Event',
          occurred: now,
          enable_batching: false
        }
      })
      expect(responses[0].status).toBe(200)
    })
  })

  describe('manageTags with channel_id', () => {
    it('should use channel audience', async () => {
      const event = createTestEvent({ traits: { airship_tags: { tag1: true } } })

      nock('https://go.urbanairship.com').post('/api/channels/tags').reply(200, {})

      const responses = await testDestination.testAction('manageTags', {
        event,
        settings: { access_token: 'foo', app_key: 'bar', endpoint: 'US' },
        mapping: {
          channel_id: 'chan-abc',
          channel_type: 'sms',
          tags: { tag1: true },
          tag_group: 'segment-integration'
        }
      })
      expect(responses[0].status).toBe(200)
    })
  })

  describe('delete', () => {
    it('should support deletes', async () => {
      const event = createTestEvent({
        userId: 'test-user-rzoj4u7gqw'
      })
      nock('https://go.urbanairship.com').post('/api/named_users/uninstall').reply(200, {})
      if (testDestination.onDelete) {
        const response = await testDestination.onDelete(event, {
          access_token: 'foo',
          app_key: 'bar',
          endpoint: 'US'
        })
        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({})
      }
    })
  })
})
