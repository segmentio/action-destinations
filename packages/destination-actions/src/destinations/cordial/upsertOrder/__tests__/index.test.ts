import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.upsertOrder', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
    }
    nock.cleanAll()
  })
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/upsertOrder').once().reply(202, {success: 'success'})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        order_id: "test-order",
        total: 546.05,
        affiliation: 'Google Store',
        revenue: 25.00,
        shipping: 3,
        tax: 2,
        discount: 2.5,
        coupon: 'hasbros',
        currency: 'USD',
        products: [
          {
            product_id: '51easf12',
            sku: 'TEST-SKU',
            name: 'TEST-SKU',
            price: 19,
            quantity: 1,
            category: 'Games',
            url: 'https://www.example.com/product/path',
            image_url: 'https:///www.example.com/product/path.jpg'
          },
          {
            product_id: 'gserq3eas',
            sku: 'TEST-SKU2',
            name: 'TEST-SKU2',
            price: 30.35,
            quantity: 2,
            category: 'Games'
          }
        ]
      }
    })

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'}
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const,
      segmentIdKey: 'segment_id'
    }

    const responses = await testDestination.testAction('upsertOrder', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(202);
    expect(responses[0].data).toMatchObject({success: 'success'});
    expect(responses[0].options.json).toMatchObject({
      userIdentities: { 'channels.email.address': 'contact@example.com' },
      orderID: 'test-order',
      purchaseDate: '1631210000',
      status: 'Order Completed',
      totalAmount: 546.05,
      properties: {
        affiliation: 'Google Store',
        revenue: 25,
        shipping: 3,
        tax: 2,
        discount: 2.5,
        coupon: 'hasbros',
        currency: 'USD'
      },
      items: [
        {
          productID: '51easf12',
          sku: 'TEST-SKU',
          category: 'Games',
          name: 'TEST-SKU',
          itemPrice: 19,
          qty: 1,
          url: 'https://www.example.com/product/path',
          imageUrl: 'https:///www.example.com/product/path.jpg',
          properties: {}
        },
        {
          productID: 'gserq3eas',
          sku: 'TEST-SKU2',
          category: 'Games',
          name: 'TEST-SKU2',
          itemPrice: 30.35,
          qty: 2,
          properties: {}
        }
      ]
    })
  })
  it('should work with required only', async () => {
    nock(/api.cordial.io/).post('/api/segment/upsertOrder').once().reply(202, {success: 'success'})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        order_id: "test-order",
        total: 546.05,
        products: [
          {
            product_id: '51easf12',
            sku: 'TEST-SKU',
            name: 'TEST-SKU',
          },
          {
            product_id: 'gserq3eas',
            sku: 'TEST-SKU2',
            name: 'TEST-SKU',
          }
        ]
      }
    })

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'},
      orderID: { '@path': '$.properties.order_id' },
      purchaseDate: { '@path': '$.timestamp' },
      status: { '@path': '$.event' },
      totalAmount: { '@path': '$.properties.total' },
      items: {
        '@arrayPath': [
          '$.properties.products',
          {
            productID: {'@path': '$.product_id'},
            sku: {'@path': '$.sku'},
            name: {'@path': '$.name'}
          }
        ]
      }
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const
    }

    const responses = await testDestination.testAction('upsertOrder', {
      event,
      mapping,
      settings,
      useDefaultMappings: false
    })

    expect(responses[0].status).toBe(202);
    expect(responses[0].data).toMatchObject({success: 'success'});
    expect(responses[0].options.json).toMatchObject({
      userIdentities: { 'channels.email.address': 'contact@example.com' },
      orderID: 'test-order',
      purchaseDate: '1631210000',
      status: 'Order Completed',
      totalAmount: 546.05,
      properties: undefined,
      items: [
        {
          productID: '51easf12',
          sku: 'TEST-SKU',
          name: 'TEST-SKU'
        },
        {
          productID: 'gserq3eas',
          sku: 'TEST-SKU2',
          name: 'TEST-SKU'
        }
      ]
    })
  })
})
