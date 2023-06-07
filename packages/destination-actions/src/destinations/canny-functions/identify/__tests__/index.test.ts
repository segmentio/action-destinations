import { BASE_API_URL } from '../../constants/api'
import Destination from '../../index'

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)
const TEST_API_KEY = 'test-api-key'

describe('CannyFunctions.identify', () => {
  it('should send a request to identify endpoint', async () => {
    const eventData = {
      timestamp: new Date().toISOString(),
      traits: {
        email: 'john@example.com',
        name: 'John'
      }
    }
    const event = createTestEvent(eventData)
    nock(BASE_API_URL).post('/v2/identify').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: TEST_API_KEY,
        customFields: ''
      }
    })
    const [response] = responses
    const parsedBody = response.options.body ? JSON.parse(response.options.body?.toString()) : {}

    expect(responses.length).toBe(1)

    expect(response.status).toBe(200)
    expect(response.data).toEqual({})
    expect(parsedBody).toEqual({
      traits: eventData.traits,
      type: event.type,
      userId: event.userId
    })
  })

  it('should send a request to identify endpoint with custom fields', async () => {
    const customFields = 'age,phone'
    const eventData = {
      timestamp: new Date().toISOString(),
      traits: {
        age: 30,
        email: 'john@example.com',
        name: 'John',
        phone: '12345678',
        title: 'Engineer'
      }
    }
    const event = createTestEvent(eventData)
    nock(BASE_API_URL).post('/v2/identify').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: TEST_API_KEY,
        customFields
      }
    })
    const [response] = responses
    const parsedBody = response.options.body ? JSON.parse(response.options.body?.toString()) : {}

    expect(responses.length).toBe(1)

    expect(response.status).toBe(200)
    expect(response.data).toEqual({})
    expect(parsedBody).toEqual({
      traits: {
        ...eventData.traits,
        customFields: {
          age: eventData.traits.age,
          phone: eventData.traits.phone
        }
      },
      type: event.type,
      userId: event.userId
    })
    expect(parsedBody.traits.customFields.title).toBeUndefined()
  })
})
