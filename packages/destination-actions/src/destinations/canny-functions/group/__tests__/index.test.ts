import { BASE_API_URL } from '../../constants/api'
import Destination from '../../index'

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)
const TEST_API_KEY = 'test-api-key'

describe('CannyFunctions.group', () => {
  it('should send a request to group endpoint', async () => {
    const eventData = {
      groupId: 'group-id',
      timestamp: new Date().toISOString(),
      traits: {
        name: 'Group Name'
      }
    }
    const event = createTestEvent(eventData)
    nock(BASE_API_URL).post('/group').reply(200, {})

    const responses = await testDestination.testAction('group', {
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
      groupId: event.groupId,
      traits: eventData.traits,
      type: event.type
    })
  })
})
