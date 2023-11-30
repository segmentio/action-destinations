import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const userId = 'fake-user-id'
const apiKey = 'fake-api-key'
const baseUrl = 'https://analytex.userpilot.io/'

describe('Userpilot.identifyUser', () => {
  it('should call identifyUser successfully', async () => {
    nock(baseUrl).post('/v1/identify').reply(202, {})

    const event = createTestEvent({
      userId: userId,
      traits: {
        name: '',
        email: '',
        createdAt: ''
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: {
        apiKey: apiKey,
        endpoint: baseUrl
      },
      mapping: {
        userId: userId,
        traits: {
          name: '',
          email: '',
          createdAt: ''
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"user_id\\":\\"fake-user-id\\",\\"metadata\\":{\\"name\\":\\"\\",\\"email\\":\\"\\",\\"createdAt\\":\\"\\"}}"`
    )

    expect(nock.isDone()).toBe(true)
  })
})
