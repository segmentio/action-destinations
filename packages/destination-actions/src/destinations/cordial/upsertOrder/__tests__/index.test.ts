import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.upsertOrder', () => {
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/upsertOrder').reply(200, {})

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
            category: '51easf12',
            name: 'TEST-SKU',
          },
          {
            product_id: 'gserq3eas',
            sku: 'TEST-SKU2',
            category: '51easf12',
            name: 'TEST-SKU',
          }
        ]
      }
    })

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'}
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const
    }

    await testDestination.testAction('upsertOrder', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })
  })
})
