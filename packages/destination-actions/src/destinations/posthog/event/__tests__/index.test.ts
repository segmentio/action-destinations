import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Posthog.event', () => {
  const endpoint = 'https://us.i.posthog.com'
  const apiKey = 'test-api-key'
  const projectId = 'test-project-id'

  beforeEach(() => nock.cleanAll())

  it('should send event to PostHog', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      userId: 'test-user-id',
      properties: {
        testProperty: 'test-value'
      }
    })

    nock(endpoint).post('/batch/').reply(200, {})

    const responses = await testDestination.testAction('event', {
      event,
      useDefaultMappings: true,
      settings: {
        api_key: apiKey,
        endpoint: endpoint,
        project_id: projectId,
        historical_migration: false
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = JSON.parse(responses[0].options.body as string)
    expect(payload).toMatchObject({
      api_key: apiKey,
      historical_migration: false,
      batch: [
        {
          event: event.event,
          properties: {
            ...event.properties,
            distinct_id: event.userId,
            $process_person_profile: false
          },
          timestamp: event.receivedAt
        }
      ]
    })
  })

  it('should throw error if required fields are missing', async () => {
    const event = createTestEvent({
      properties: {
        testProperty: 'test-value'
      }
    })

    await expect(
      testDestination.testAction('event', {
        event,
        mapping: {
          // Only provide properties, missing required event_name and distinct_id
          properties: {
            '@path': '$.properties'
          }
        },
        settings: {
          api_key: apiKey,
          endpoint: endpoint,
          project_id: projectId,
          historical_migration: false
        }
      })
    ).rejects.toThrow()
  })
})
