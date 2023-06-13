import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const userId = 'fake-user-id'
const apiKey = 'fake-api-key'
const baseUrl = 'https://analytex.userpilot.io/'

describe('Userpilot.trackEvent', () => {
  it('should call trackEvent successfully', async () => {
    nock(baseUrl).post('/v1/track').reply(202, {})

    const event = createTestEvent({
      name: 'test',
      userId: userId,
      properties: {
        name: 'test',
        email: ''
      }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings: {
        apiKey: apiKey,
        endpoint: 'https://analytex.userpilot.io/'
      },
      mapping: {
        name: 'test',
        userId: userId,
        properties: {
          name: 'test',
          email: ''
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"user_id\\":\\"fake-user-id\\",\\"event_name\\":\\"test\\",\\"metadata\\":{\\"name\\":\\"test\\",\\"email\\":\\"\\"}}"`
    )

    expect(nock.isDone()).toBe(true)
  })
})
