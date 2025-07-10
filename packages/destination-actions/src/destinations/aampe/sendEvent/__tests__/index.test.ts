import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  apiKey: 'test-api-key',
  region: 'https://ingestion.api.aampe.com/v1/'
}

const receivedAt = '2023-01-01T00:00:00.000Z'

describe('Aampe.sendEvent', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should send event with required fields', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user123',
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
      timestamp: expect.any(Number)
    })
  })

  it('should convert timestamp to Unix timestamp', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Timestamp Test',
      userId: 'user123',
      timestamp: '2023-01-01T00:00:00.000Z',
      receivedAt
    })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBeGreaterThan(0)
    expect((responses[0].options.json as any).timestamp).toBe(1672531200) // Unix timestamp for 2023-01-01T00:00:00.000Z
  })

  it('should include optional fields when provided', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Full Event',
      userId: 'user123',
      properties: {
        category: 'test',
        value: 100
      },
      context: {
        timezone: 'America/New_York'
      },
      messageId: 'msg-123',
      receivedAt
    })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'Full Event',
      timestamp: expect.any(Number),
      timezone: 'America/New_York',
      metadata: {
        category: 'test',
        value: 100
      },
      event_id: 'msg-123'
    })
  })

  it('should handle missing optional fields gracefully', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Minimal Event',
      userId: 'user123',
      receivedAt
    })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'Minimal Event',
      timestamp: expect.any(Number)
    })
  })

  it('should use anonymousId when userId is not available', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Anonymous Event',
      anonymousId: 'anon123',
      userId: undefined,
      receivedAt
    })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBeGreaterThan(0)
    expect((responses[0].options.json as any).contact_id).toBe('anon123')
  })

  it('should handle custom mappings', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Custom Event',
      userId: 'user123',
      receivedAt
    })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        contact_id: 'custom_user',
        event_name: 'Custom Event Name',
        timestamp: '2023-01-01T12:00:00.000Z',
        timezone: 'UTC',
        metadata: {
          custom_field: 'custom_value'
        },
        event_id: 'custom-event-id'
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'custom_user',
      event_name: 'Custom Event Name',
      timestamp: expect.any(Number),
      timezone: 'UTC',
      metadata: {
        custom_field: 'custom_value'
      },
      event_id: 'custom-event-id'
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

  it('should include proper authorization header', async () => {
    nock('https://ingestion.api.aampe.com')
      .post('/v1/events')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Auth Test',
      userId: 'user123',
      receivedAt
    })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBeGreaterThan(0)
    expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test-api-key')
  })
})
