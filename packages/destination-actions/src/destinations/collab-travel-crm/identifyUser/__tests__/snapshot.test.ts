/**
 * Snapshot tests for identifyUser action
 */

import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

const actionSlug = 'identifyUser'
const destinationSlug = 'Collab Travel CRM'

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('required fields', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: 'test@example.com'
      },
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('all fields', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user-123',
      traits: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0100',
        company: 'Acme Travel'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: { '@path': '$.traits.email' },
        firstName: { '@path': '$.traits.firstName' },
        lastName: { '@path': '$.traits.lastName' },
        phone: { '@path': '$.traits.phone' },
        userId: { '@path': '$.userId' },
        traits: { '@path': '$.traits' }
      },
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
