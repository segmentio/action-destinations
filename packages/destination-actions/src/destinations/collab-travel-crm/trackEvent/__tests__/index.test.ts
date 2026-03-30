/**
 * Track Event Action Tests
 *
 * Tests the trackEvent action for sending track events to Collab Travel CRM
 */

import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

describe('trackEvent', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should send track event with all fields', async () => {
    const requestBody = {
      type: 'track',
      event: 'Trip Booked',
      userId: 'user-123',
      anonymousId: 'anon-456',
      timestamp: '2025-01-15T12:00:00.000Z',
      properties: {
        destination: 'Maldives',
        value: 12000,
        currency: 'USD',
        travelers: 2
      }
    }

    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body).toMatchObject(requestBody)
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Trip Booked',
      userId: 'user-123',
      anonymousId: 'anon-456',
      timestamp: '2025-01-15T12:00:00.000Z',
      properties: {
        destination: 'Maldives',
        value: 12000,
        currency: 'USD',
        travelers: 2
      }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: { '@path': '$.event' },
        properties: { '@path': '$.properties' },
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        timestamp: { '@path': '$.timestamp' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send track event with only required fields', async () => {
    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body.type).toBe('track')
        expect(body.event).toBe('Lead Created')
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Lead Created'
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: 'Lead Created'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should handle missing optional properties gracefully', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Page Viewed',
      anonymousId: 'anon-789'
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: { '@path': '$.event' },
        anonymousId: { '@path': '$.anonymousId' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should include Authorization header in request', async () => {
    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination')
      .matchHeader('Authorization', 'Bearer my-secret-key')
      .matchHeader('Content-Type', 'application/json')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event'
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: { apiKey: 'my-secret-key' },
      mapping: {
        eventName: 'Test Event'
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('should handle server errors gracefully', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(500, { error: 'Internal Server Error' })

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event'
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          eventName: 'Test Event'
        }
      })
    ).rejects.toThrow()
  })

  it('should send correct endpoint URL', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Proposal Sent'
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: 'Proposal Sent'
      }
    })

    expect(responses[0].url).toBe(`${COLLAB_CRM_BASE_URL}/segment-destination`)
  })

  it('should handle complex properties object', async () => {
    const complexProperties = {
      destination: 'Safari, Kenya',
      travelers: [
        { name: 'John Doe', type: 'adult' },
        { name: 'Jane Doe', type: 'adult' }
      ],
      flights: {
        outbound: 'KQ100',
        return: 'KQ101'
      },
      total_value: 8500.0,
      currency: 'USD'
    }

    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body.properties).toMatchObject(complexProperties)
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Trip Booked',
      properties: complexProperties
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: { '@path': '$.event' },
        properties: { '@path': '$.properties' }
      }
    })

    expect(responses[0].status).toBe(200)
  })
})
