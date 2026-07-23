import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const testPurchaseEvent = createTestEvent({
  timestamp: '2022-05-12T15:21:15.449Z',
  messageId: 'test-message-purchase',
  event: 'Order Completed',
  type: 'track',
  properties: {
    email: 'test@example.com',
    phone: '+15551234567',
    order_id: 'order_123',
    revenue: 99.99,
    currency: 'USD',
    products: [
      {
        product_id: 'product_1',
        category: 'Electronics',
        brand: 'TestBrand',
        price: 49.99,
        quantity: 1
      },
      {
        product_id: 'product_2',
        category: 'Electronics',
        brand: 'TestBrand',
        price: 50.00,
        quantity: 1
      }
    ]
  }
})

describe('Snap Conversions API - Track Purchase', () => {
  it('should track purchase events with PURCHASE event name', async () => {
    nock('https://tr.snapchat.com')
      .post('/v3/pixel123/events')
      .query({ access_token: 'access123' })
      .reply(200, { status: 'success' })

    const responses = await testDestination.testAction('trackPurchase', {
      event: testPurchaseEvent,
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