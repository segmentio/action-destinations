import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.removeProductFromCart', () => {
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/removeProductFromCart').reply(200, {})

    const event = createTestEvent({
      event: 'Product Removed',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        product_id: '51easf12',
        quantity: 2
      }
    })

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'}
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const
    }

    await testDestination.testAction('removeProductFromCart', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })
  })
})
