/**
 * Snapshot tests for trackEvent action
 */

import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

const actionSlug = 'trackEvent'
const destinationSlug = 'Collab Travel CRM'

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('required fields', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event'
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: 'Test Event'
      },
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('all fields', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      event: 'Trip Booked',
      userId: 'user-123',
      anonymousId: 'anon-456',
      timestamp: '2025-01-15T12:00:00.000Z',
      properties: {
        destination: 'Maldives',
        value: 5000
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        eventName: { '@path': '$.event' },
        properties: { '@path': '$.properties' },
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        timestamp: { '@path': '$.timestamp' }
      },
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
