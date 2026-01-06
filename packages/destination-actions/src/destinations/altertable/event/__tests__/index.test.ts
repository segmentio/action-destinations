import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Altertable.event', () => {
  const endpoint = 'https://api.altertable.ai'
  const apiKey = 'test-api-key'
  const environment = 'test-environment'

  beforeEach(() => nock.cleanAll())

  it('should send event to Altertable', async () => {
    const event = createTestEvent({
      timestamp: '2026-01-05T09:35:42.275Z',
      properties: {
        testProperty: 'test-value'
      },
      context: {
        device: {
          id: 'test-device-id'
        }
      }
    })

    nock(endpoint).post('/track').reply(200, {})

    const responses = await testDestination.testAction('event', {
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
        anonymous_id: "anonId1234",
        device_id: "test-device-id",
        distinct_id: "user1234",
        environment: "test-environment",
        event: "Test Event",
        properties: {
            $lib: "altertable-segment",
            testProperty: "test-value"
        },
        timestamp: "2026-01-05T09:35:42.275Z"
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
          // Only provide properties, missing required event, userId, and timestamp
          properties: {
            '@path': '$.properties'
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
      type: 'track',
      properties: {
        customProp: 'custom-value'
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

    nock(endpoint).post('/track').reply(200, {})

    const responses = await testDestination.testAction('event', {
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

    // Verify context mappings
    expect(payload.properties).toMatchObject({
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

      // Event properties should still be present
      customProp: 'custom-value'
    })

    // Verify device_id is extracted correctly
    expect(payload.device_id).toBe('device-123')
  })
})
