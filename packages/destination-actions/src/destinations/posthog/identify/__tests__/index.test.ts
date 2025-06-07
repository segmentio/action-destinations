import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Posthog.identify', () => {
  const endpoint = 'https://app.posthog.com'
  const apiKey = 'test-api-key'
  const projectId = 'test-project-id'

  beforeEach(() => nock.cleanAll())

  it('should send identify event to PostHog', async () => {
    const event = createTestEvent({
      userId: 'test-user-id',
      traits: {
        name: 'Test User',
        email: 'test@example.com',
        plan: 'premium'
      },
      receivedAt: '2024-01-01T00:00:00.000Z'
    })

    nock(endpoint).post('/i/v0/e/').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      event,
      useDefaultMappings: true,
      settings: {
        api_key: apiKey,
        endpoint: endpoint,
        project_id: projectId
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = JSON.parse(responses[0].options.body as string)
    expect(payload).toMatchObject({
      api_key: apiKey,
      distinct_id: event.userId,
      properties: {
        $set: event.traits
      }
    })
    expect(payload.timestamp).toBe(event.receivedAt)
  })

  it('should throw error if required fields are missing', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User'
      }
    })

    await expect(
      testDestination.testAction('identify', {
        event,
        mapping: {
          // Only provide properties, missing required distinct_id
          properties: {
            '@path': '$.traits'
          }
        },
        settings: {
          api_key: apiKey,
          endpoint: endpoint,
          project_id: projectId
        }
      })
    ).rejects.toThrow()
  })
})
