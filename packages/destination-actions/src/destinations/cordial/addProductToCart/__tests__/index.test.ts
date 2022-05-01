import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.addProductToCart', () => {
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/addProductToCart').reply(200, {})

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
      endpoint: 'https://api.cordial.io' as const
    }

    await testDestination.testAction('addProductToCart', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })
  })
})
