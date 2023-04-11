import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { baseURL } from '../../request-params'

const testDestination = createTestIntegration(Destination)

describe('Gwen.identifyUser', () => {
  it('should start a user session', async () => {
    const event = createTestEvent({ userId: '2d947e75-de80-4776-8e0e-4d645977d3df' })
    nock(baseURL)
      .post('')
      .reply(200, {
        data: {
          userSession: {
            timestamp: Date.now()
          }
        }
      })

    const t = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: { apiKey: 'my-api-key' }
    })

    expect(t[0].status).toBe(200)

    const query = {
      operationName: 'UserSession',
      query: `mutation UserSession($userId: UUID!, $session: UserSessionInput) {
          userSession(userId: $userId, data: $session) {
            timestamp
          }
        }`,
      variables: {
        userId: event.userId,
        session: {
          ip: event.context?.ip,
          userAgent: event.context?.userAgent
        }
      }
    }

    expect(t[0].options.body).toEqual(JSON.stringify(query))
  })

  it('User ID must be a UUID', async () => {
    await expect(
      testDestination.testAction('identifyUser', {
        event: createTestEvent({
          userId: 'user-id-123'
        }),
        useDefaultMappings: true,
        settings: { apiKey: 'my-api-key' }
      })
    ).rejects.toThrow('User ID must be a valid uuid string but it was not.')
  })
})
