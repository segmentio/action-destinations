import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const API_KEY = 'sample-api-token'
const API_URL = 'https://main-api.nudgenow.com/api/'
const timestamp = '2025-05-12T12:35:12.826Z'

describe('Nudge.identifyUser', () => {
  it('should successfully identify a new user', async () => {
    const event = createTestEvent({
      timestamp,
      traits: {
        phone: '9999999999',
        email: 'test@email.com',
        name: 'John Doe'
      },
      userId: 'test-user'
    })

    nock(API_URL).put('/integration/segment/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apikey: API_KEY
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('should throw error on invalid ext_id', async () => {
    const event = createTestEvent({
      timestamp,
      traits: {
        phone: '9999999999',
        email: 'test@email.com',
        name: 'John Doe'
      },
      userId: 'Invalid User'
    })

    nock(API_URL).put('/integration/segment/identify').reply(400, {
      message: 'VALIDATION_FAILED'
    })

    const responses = testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apikey: API_KEY
      }
    })

    await expect(responses).rejects.toThrowError()
  })
})
