import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BatchJSON } from '../type'

const settings = {
  apiToken: '<REST_API_KEY>', // = REST API Key
  projectKey: '<PROJECT_KEY>',
  endpoint: 'https://api.batch.com/2.6/profiles/update' as const
}

const testDestination = createTestIntegration(Destination)

describe('Batch.updateProfile', () => {
  it('should process required fields correctly', async () => {
    const eventData = {
      receivedAt: '2025-01-02T14:18:45.187Z',
      timestamp: '2025-01-02T14:18:42.235Z',
      properties: {
        id: 39792,
        email: 'antoine39792@hotmail.com',
        firstName: 'Test',
        lastName: 'User',
        birthday: '2024-06-06T18:13:48+02:00'
      },
      context: {
        library: {
          name: 'unknown',
          version: 'unknown'
        }
      },
      type: 'identify',
      userId: '8de68ddc-22ab-4c1e-a50b-dd6f3a63da06',
      originalTimestamp: '2025-01-02T14:18:42.235Z',
      messageId: 'api-2r4o5eBJElExhnmTMqEg3OAEL7H',
      integrations: {}
    }

    const event = createTestEvent({
      properties: eventData
    })

    const json: BatchJSON[] = [
      {
        identifiers: {
          custom_id: 'user1234'
        },
        attributes: {
          $language: 'en',
          $region: 'US',
          $timezone: 'Europe/Amsterdam'
        },
        events: [
          {
            name: 'test_event',
            attributes: {
              'date(receivedat)': '2025-01-02T14:18:45.187Z',
              'date(timestamp)': '2025-01-02T14:18:42.235Z',
              properties: {
                id: 39792,
                email: 'antoine39792@hotmail.com',
                firstname: 'Test',
                lastname: 'User',
                birthday: '2024-06-06T18:13:48+02:00'
              },
              type: 'identify',
              userid: '8de68ddc-22ab-4c1e-a50b-dd6f3a63da06',
              'date(originaltimestamp)': '2025-01-02T14:18:42.235Z',
              messageid: 'api-2r4o5eBJElExhnmTMqEg3OAEL7H',
              integrations: {}
            }
          }
        ]
      }
    ]

    nock('https://api.batch.com').post('/2.5/profiles/update', JSON.stringify(json)).reply(200, {})

    const responses = await testDestination.testAction('updateProfile', {
      event: event,
      useDefaultMappings: true,
      settings: settings,
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
