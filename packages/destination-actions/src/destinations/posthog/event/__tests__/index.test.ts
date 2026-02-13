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

  it('should include $geoip_disable in batch event properties when geoip_disable setting is true', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      userId: 'test-user-id',
      properties: { testProperty: 'test-value' }
    })

    nock(endpoint).post('/batch/').reply(200, {})

    const responses = await testDestination.testAction('event', {
      event,
      useDefaultMappings: true,
      settings: {
        api_key: apiKey,
        endpoint: endpoint,
        project_id: projectId,
        historical_migration: false,
        geoip_disable: true
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = JSON.parse(responses[0].options.body as string)
    expect(payload.batch[0].properties).toMatchObject({
      $geoip_disable: true
    })
  })

  it('should include extra_properties in batch event properties when provided', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      userId: 'test-user-id',
      properties: { testProperty: 'test-value' }
    })

    nock(endpoint).post('/batch/').reply(200, {})

    const extraProperties = { custom_key: 'custom_value', another_key: 123 }

    const responses = await testDestination.testAction('event', {
      event,
      useDefaultMappings: true,
      mapping: {
        event_name: { '@path': '$.event' },
        distinct_id: { '@path': '$.userId' },
        properties: { '@path': '$.properties' },
        anonymous_event_capture: false,
        enable_batching: false,
        extra_properties: extraProperties
      },
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
    expect(payload.batch[0].properties).toMatchObject(extraProperties)
  })

  it('should not include $geoip_disable when geoip_disable setting is false', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      userId: 'test-user-id',
      properties: { testProperty: 'test-value' }
    })

    nock(endpoint).post('/batch/').reply(200, {})

    const responses = await testDestination.testAction('event', {
      event,
      useDefaultMappings: true,
      settings: {
        api_key: apiKey,
        endpoint: endpoint,
        project_id: projectId,
        historical_migration: false,
        geoip_disable: false
      }
    })

    expect(responses.length).toBe(1)
    const payload = JSON.parse(responses[0].options.body as string)
    expect(payload.batch[0].properties.$geoip_disable).toBeUndefined()
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
