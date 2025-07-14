import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { usURL } from '../constants'

const testDestination = createTestIntegration(Definition)

const settings = {
  apiKey: 'test-api-key',
  region: usURL
}

const receivedAt = '2023-01-01T00:00:00.000Z'

describe('Aampe', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://ingestion.api.aampe.com')
        .get('/v1/')
        .reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })
  })

  describe('sendEvent', () => {
    it('should work with default mappings', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Test Event',
        userId: 'user123',
        properties: {
          test_prop: 'test_value'
        },
        receivedAt
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({ success: true })
      expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test-api-key')
      expect(responses[0].options.json).toMatchObject({
        contact_id: 'user123',
        event_name: 'Test Event',
        timestamp: expect.any(Number),
        metadata: {
          test_prop: 'test_value'
        }
      })
    })

    it('should work with custom mappings', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Custom Event',
        userId: 'custom_user',
        properties: {
          custom_prop: 'custom_value'
        },
        receivedAt
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings,
        mapping: {
          contact_id: 'custom_user',
          event_name: 'Custom Event',
          timestamp: '2023-01-01T00:00:00.000Z',
          timezone: 'UTC',
          metadata: {
            custom_prop: 'custom_value'
          },
          event_id: 'custom-event-id'
        }
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        contact_id: 'custom_user',
        event_name: 'Custom Event',
        timestamp: expect.any(Number),
        timezone: 'UTC',
        metadata: {
          custom_prop: 'custom_value'
        },
        event_id: 'custom-event-id'
      })
    })

    it('should work with anonymous users', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Anonymous Event',
        anonymousId: 'anon123',
        userId: undefined,
        properties: {},
        receivedAt
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        contact_id: 'anon123',
        event_name: 'Anonymous Event',
        timestamp: expect.any(Number)
      })
    })

    it('should work with page events', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'page',
        name: 'Home Page',
        userId: 'user123',
        properties: {
          url: 'https://example.com',
          title: 'Home'
        },
        receivedAt
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        contact_id: 'user123',
        event_name: 'Test Event',
        timestamp: expect.any(Number),
        metadata: {
          url: 'https://example.com',
          title: 'Home'
        }
      })
    })

    it('should work with screen events', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'screen',
        name: 'Main Screen',
        userId: 'user123',
        properties: {
          screen_name: 'Main'
        },
        receivedAt
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        contact_id: 'user123',
        event_name: 'Test Event',
        timestamp: expect.any(Number),
        metadata: {
          screen_name: 'Main'
        }
      })
    })

    it('should handle timezone from context', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Timezone Event',
        userId: 'user123',
        context: {
          timezone: 'America/New_York'
        },
        receivedAt
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        contact_id: 'user123',
        event_name: 'Timezone Event',
        timestamp: expect.any(Number),
        timezone: 'America/New_York'
      })
    })

    it('should handle error responses', async () => {
      nock('https://ingestion.api.aampe.com')
        .post('/v1/events')
        .reply(400, { error: 'Bad Request' })

      const event = createTestEvent({
        type: 'track',
        event: 'Error Event',
        userId: 'user123',
        receivedAt
      })

      await expect(
        testDestination.testAction('sendEvent', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })
  })
})
