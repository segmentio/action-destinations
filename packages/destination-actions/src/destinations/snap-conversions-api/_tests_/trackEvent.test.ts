import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const testEvent = createTestEvent({
  timestamp: '2022-05-12T15:21:15.449Z',
  messageId: 'test-message-trackEvent',
  event: 'Product Viewed',
  type: 'track',
  properties: {
    email: 'test@example.com',
    phone: '+15551234567',
    product_id: 'test_product_123',
    value: 25.99,
    currency: 'USD'
  },
  context: {
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})

describe('Snap Conversions API - Track Event', () => {
  it('should track standard events with default mappings', async () => {
    nock('https://tr.snapchat.com')
      .post('/v3/pixel123/events')
      .query({ access_token: 'access123' })
      .reply(200, { status: 'success' })

    const responses = await testDestination.testAction('trackEvent', {
      event: testEvent,
      settings: {
        pixel_id: 'pixel123',
        snap_app_id: 'app123'
      },
      useDefaultMappings: true,
      auth: {
        accessToken: 'access123',
        refreshToken: 'refresh123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should automatically map segment event names to snapchat event names', async () => {
    const productViewedEvent = createTestEvent({
      ...testEvent,
      event: 'Product Viewed'
    })

    nock('https://tr.snapchat.com')
      .post('/v3/pixel123/events')
      .query({ access_token: 'access123' })
      .reply(200, { status: 'success' })

    const responses = await testDestination.testAction('trackEvent', {
      event: productViewedEvent,
      settings: {
        pixel_id: 'pixel123',
        snap_app_id: 'app123'
      },
      useDefaultMappings: true,
      auth: {
        accessToken: 'access123',
        refreshToken: 'refresh123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should batch multiple events', async () => {
    const batchEvents = [testEvent, { ...testEvent, messageId: 'test-message-2' }]
    
    nock('https://tr.snapchat.com')
      .post('/v3/pixel123/events')
      .query({ access_token: 'access123' })
      .reply(200, { status: 'success' })

    const responses = await testDestination.testBatchAction('trackEvent', {
      events: batchEvents,
      settings: {
        pixel_id: 'pixel123',
        snap_app_id: 'app123'
      },
      useDefaultMappings: true,
      auth: {
        accessToken: 'access123',
        refreshToken: 'refresh123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})