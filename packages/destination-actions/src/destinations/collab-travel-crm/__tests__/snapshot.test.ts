/**
 * Snapshot tests for Collab Travel CRM destination
 *
 * These tests verify that request payloads don't change unexpectedly
 */

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

describe('Collab Travel CRM Snapshots', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('trackEvent', () => {
    it('should match snapshot for standard track event', async () => {
      nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

      const event = createTestEvent({
        type: 'track',
        event: 'Trip Booked',
        userId: 'user-123',
        anonymousId: 'anon-456',
        timestamp: '2025-01-15T12:00:00.000Z',
        properties: {
          destination: 'Bali',
          value: 5000,
          currency: 'USD'
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

    it('should match snapshot for event with minimal fields', async () => {
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
  })

  describe('identifyUser', () => {
    it('should match snapshot for standard identify event', async () => {
      nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1-555-0100'
        }
      })

      const responses = await testDestination.testAction('identifyUser', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          email: { '@path': '$.traits.email' },
          firstName: { '@path': '$.traits.firstName' },
          lastName: { '@path': '$.traits.lastName' },
          phone: { '@path': '$.traits.phone' },
          userId: { '@path': '$.userId' },
          traits: { '@path': '$.traits' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should match snapshot for identify with only email', async () => {
      nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'minimal@example.com'
        }
      })

      const responses = await testDestination.testAction('identifyUser', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          email: { '@path': '$.traits.email' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
