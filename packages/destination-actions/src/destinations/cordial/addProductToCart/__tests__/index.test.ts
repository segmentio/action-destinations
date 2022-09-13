import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.addProductToCart', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
    }
    nock.cleanAll()
  })
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/addProductToCart').once().reply(202, {success: 'success'})

    const event = createTestEvent({
      event: 'Product Added',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        product_id: '51easf12',
        sku: 'TEST-SKU',
        quantity: 2,
        category: '51easf12',
        name: 'TEST-SKU',
        price: 2.35,
        url: 'https://example.com/product1',
        image_url: 'https://cdn.example.com/product.jpg',
        brand: 'Test brand',
        variant: 'black',
        coupon: 'APPLY50%',
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

    const responses = await testDestination.testAction('addProductToCart', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(202);
    expect(responses[0].data).toMatchObject({success: 'success'});
    expect(responses[0].options.json).toMatchObject({
      category: '51easf12',
      description: undefined,
      imageUrl: 'https://cdn.example.com/product.jpg',
      itemPrice: 2.35,
      name: 'TEST-SKU',
      productID: '51easf12',
      properties: {
        brand: 'Test brand',
        coupon: 'APPLY50%',
        variant: 'black'
       },
      qty: 2,
      sku: 'TEST-SKU',
      url: 'https://example.com/product1',
      userIdentities: {
       'channels.email.address': 'contact@example.com'
      },
    })
  })
  it('should work with required only', async () => {
    nock(/api.cordial.io/).post('/api/segment/addProductToCart').reply(202, {success: 'success'})

    const event = createTestEvent({
      event: 'Product Added',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        product_id: '51easf12',
        sku: 'TEST-SKU',
        quantity: 2,
        category: '51easf12',
        name: 'TEST-SKU',
        price: 2.35,
        url: 'https://example.com/product1',
        image_url: 'https://cdn.example.com/product.jpg',
        brand: 'Test brand',
        variant: 'black',
        coupon: 'APPLY50%'
      }
    })

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'},
      productID: {'@path': '$.properties.product_id'},
      sku: {'@path': '$.properties.sku'},
      qty: {'@path': '$.properties.quantity'},
      category: {'@path': '$.properties.category'},
      name: {'@path': '$.properties.name'}
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const
    }

    const responses = await testDestination.testAction('addProductToCart', {
      event,
      mapping,
      settings,
      useDefaultMappings: false
    })

    expect(responses[0].status).toBe(202);
    expect(responses[0].data).toMatchObject({success: 'success'});
    expect(responses[0].options.json).toMatchObject({
      category: '51easf12',
      description: undefined,
      imageUrl: undefined,
      itemPrice: undefined,
      name: 'TEST-SKU',
      productID: '51easf12',
      properties: undefined,
      qty: 2,
      sku: 'TEST-SKU',
      url: undefined,
      userIdentities: {
        'channels.email.address': 'contact@example.com'
      }
    })
  })
})
