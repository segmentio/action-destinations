import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Altertable.identify', () => {
  const endpoint = 'https://api.altertable.ai'
  const apiKey = 'test-api-key'
  const environment = 'test-environment'

  beforeEach(() => nock.cleanAll())

  it('should send identify event to Altertable', async () => {
    const event = createTestEvent({
      userId: 'test-user-id',
      traits: {
        name: 'Test User',
        email: 'test@example.com',
        plan: 'premium'
      },
      timestamp: '2024-01-01T00:00:00.000Z'
    })

    nock(endpoint).post('/identify').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: apiKey,
        endpoint: endpoint,
        environment: environment
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = JSON.parse(responses[0].options.body as string)
    expect(payload).toMatchObject({
      environment: environment,
      distinct_id: event.userId,
      traits: expect.objectContaining(event.traits),
      timestamp: event.timestamp
    })
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
          // Only provide traits, missing required userId and timestamp
          traits: {
            '@path': '$.traits'
          }
        },
        settings: {
          apiKey: apiKey,
          endpoint: endpoint,
          environment: environment
        }
      })
    ).rejects.toThrow()
  })

  it('should correctly map Segment context properties to Altertable format', async () => {
    const event: SegmentEvent = {
      type: 'identify',
      userId: 'test-user-id',
      traits: {
        name: 'Test User',
        email: 'test@example.com',
        customTrait: 'custom-value'
      },
      context: {
        ip: '192.168.1.1',
        page: {
          url: 'https://example.com/page',
          referrer: 'https://google.com'
        },
        os: {
          name: 'iOS'
        },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        screen: {
          width: 375,
          height: 667
        },
        campaign: {
          name: 'summer-sale',
          source: 'google',
          medium: 'cpc',
          term: 'shoes',
          content: 'ad-variant-a'
        },
        library: {
          name: 'analytics.js',
          version: '3.0.0'
        },
        device: {
          id: 'device-123'
        }
      }
    }

    nock(endpoint).post('/identify').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: apiKey,
        endpoint: endpoint,
        environment: environment
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = JSON.parse(responses[0].options.body as string)

    // Verify context mappings are merged into traits
    expect(payload.traits).toMatchObject({
      // Direct context mappings
      $ip: '192.168.1.1',
      $url: 'https://example.com/page',
      $referer: 'https://google.com',
      $os: 'iOS',
      $user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',

      // Screen dimensions -> viewport
      $viewport: '375x667',

      // Campaign mappings
      $utm_campaign: 'summer-sale',
      $utm_source: 'google',
      $utm_medium: 'cpc',
      $utm_term: 'shoes',
      $utm_content: 'ad-variant-a',

      // Library mappings
      $lib: 'analytics.js',
      $lib_version: '3.0.0',

      // User traits should still be present
      name: 'Test User',
      email: 'test@example.com',
      customTrait: 'custom-value'
    })

    // Verify device_id is extracted correctly
    expect(payload.device_id).toBe('device-123')
    expect(payload.distinct_id).toBe('test-user-id')
  })
})
