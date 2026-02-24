import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const testSettings = {
  apiKey: 'test_dd_api_key',
  appKey: 'test_dd_app_key',
  site: 'datadoghq.com'
}

describe('Datadog.sendEventV2', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should send an alert event with required fields', async () => {
    nock('https://event-management-intake.datadoghq.com').post('/api/v2/events').reply(202, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      userId: 'user-123',
      timestamp: '2024-01-15T10:30:00.000Z',
      properties: {
        orderId: 'ord-456',
        total: 99.99
      }
    })

    const responses = await testDestination.testAction('sendEventV2', {
      event,
      mapping: {
        title: { '@path': '$.event' },
        category: 'alert',
        alertStatus: 'ok',
        customAttributes: { '@path': '$.properties' }
      },
      useDefaultMappings: true,
      settings: testSettings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    const body = responses[0].options.json as Record<string, unknown>
    expect(body).toMatchObject({
      data: {
        type: 'event',
        attributes: {
          title: 'Order Completed',
          category: 'alert',
          integration_id: 'custom-events',
          attributes: {
            status: 'ok'
          }
        }
      }
    })
  })

  it('should send a change event with changed_resource fields', async () => {
    nock('https://event-management-intake.datadoghq.com').post('/api/v2/events').reply(202, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Feature Flag Updated',
      userId: 'user-123',
      timestamp: '2024-01-15T10:30:00.000Z',
      properties: {
        flagName: 'new-checkout-flow',
        enabled: true
      }
    })

    const responses = await testDestination.testAction('sendEventV2', {
      event,
      mapping: {
        title: { '@path': '$.event' },
        category: 'change',
        changedResourceName: 'new-checkout-flow',
        changedResourceType: 'feature_flag'
      },
      useDefaultMappings: true,
      settings: testSettings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    const body = responses[0].options.json as Record<string, unknown>
    expect(body).toMatchObject({
      data: {
        type: 'event',
        attributes: {
          title: 'Feature Flag Updated',
          category: 'change',
          integration_id: 'custom-events',
          attributes: {
            changed_resource: {
              name: 'new-checkout-flow',
              type: 'feature_flag'
            }
          }
        }
      }
    })
  })

  it('should include optional fields when provided', async () => {
    nock('https://event-management-intake.datadoghq.com').post('/api/v2/events').reply(202, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Payment Failed',
      userId: 'user-456',
      timestamp: '2024-01-15T10:30:00.000Z',
      context: {
        ip: '203.0.113.42'
      },
      properties: { errorCode: 'CARD_DECLINED' }
    })

    const responses = await testDestination.testAction('sendEventV2', {
      event,
      mapping: {
        title: { '@path': '$.event' },
        category: 'alert',
        alertStatus: 'error',
        alertPriority: '2',
        message: 'Payment failed for user-456',
        aggregationKey: { '@path': '$.userId' },
        host: { '@path': '$.context.ip' },
        tags: ['env:prod', 'service:payments'],
        customAttributes: { '@path': '$.properties' }
      },
      useDefaultMappings: true,
      settings: testSettings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    const body = responses[0].options.json as Record<string, unknown>
    const attrs = (body.data as Record<string, unknown>).attributes as Record<string, unknown>

    expect(attrs.message).toBe('Payment failed for user-456')
    expect(attrs.aggregation_key).toBe('user-456')
    expect(attrs.host).toBe('203.0.113.42')
    expect(attrs.tags).toEqual(['env:prod', 'service:payments'])

    const innerAttrs = attrs.attributes as Record<string, unknown>
    expect(innerAttrs.status).toBe('error')
    expect(innerAttrs.priority).toBe('2')
    expect(innerAttrs.custom).toEqual({ errorCode: 'CARD_DECLINED' })
  })

  it('should use eu site when configured', async () => {
    nock('https://event-management-intake.datadoghq.eu').post('/api/v2/events').reply(202, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user-789'
    })

    const responses = await testDestination.testAction('sendEventV2', {
      event,
      mapping: {
        title: { '@path': '$.event' },
        category: 'alert',
        alertStatus: 'ok'
      },
      settings: {
        apiKey: 'test_api_key',
        appKey: 'test_app_key',
        site: 'datadoghq.eu'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
  })

  it('should handle API errors gracefully', async () => {
    nock('https://event-management-intake.datadoghq.com')
      .post('/api/v2/events')
      .reply(403, { errors: ['Forbidden'] })

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user-123'
    })

    await expect(
      testDestination.testAction('sendEventV2', {
        event,
        mapping: {
          title: { '@path': '$.event' },
          category: 'alert',
          alertStatus: 'ok'
        },
        settings: {
          apiKey: 'invalid_key',
          appKey: 'invalid_app_key',
          site: 'datadoghq.com'
        }
      })
    ).rejects.toThrowError()
  })

  it('should set correct authentication headers', async () => {
    nock('https://event-management-intake.datadoghq.com').post('/api/v2/events').reply(202, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user-123'
    })

    const responses = await testDestination.testAction('sendEventV2', {
      event,
      mapping: {
        title: { '@path': '$.event' },
        category: 'alert',
        alertStatus: 'ok'
      },
      settings: testSettings
    })

    expect(responses[0].options.headers).toMatchObject({
      'DD-API-KEY': 'test_dd_api_key',
      'DD-APPLICATION-KEY': 'test_dd_app_key'
    })
  })
})
