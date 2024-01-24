import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { baseURL } from '../../request-params'

const testDestination = createTestIntegration(Destination)

describe('Gwen.sendEvent', () => {
  it('should send an event', async () => {
    const event = createTestEvent({
      userId: '2d947e75-de80-4776-8e0e-4d645977d3df'
    })
    nock(baseURL)
      .post('')
      .reply(200, {
        data: {
          sendEvent: true
        }
      })

    const t = await testDestination.testAction('sendEvent', {
      event,
      useDefaultMappings: true,
      mapping: {
        data: {
          '@path': '$.'
        }
      },
      settings: { apiKey: 'my-api-key' }
    })

    expect(t[0].status).toBe(200)

    const query = {
      operationName: 'SendEvent',
      query: `mutation SendEvent($userId: UUID!, $type: String!, $data: JSONObject) {\n event(userId: $userId, type: $type, data: $data)\n}`,
      variables: {
        userId: event.userId,
        type: event.type,
        data: event
      }
    }

    expect(t[0].options.body).toEqual(JSON.stringify(query))
  })

  it('userId must be UUID', async () => {
    await expect(
      testDestination.testAction('sendEvent', {
        event: createTestEvent({
          userId: 'user-id-123'
        }),
        useDefaultMappings: true,
        settings: { apiKey: 'my-api-key' }
      })
    ).rejects.toThrow('User ID must be a valid uuid string but it was not.')
  })
})
