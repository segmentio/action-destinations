import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.removeProductFromCart', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
    }
    nock.cleanAll()
  })
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/removeProductFromCart').once().reply(202, {success: 'success'})

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
      endpoint: 'https://api.cordial.io' as const,
      segmentIdKey: 'segment_id'
    }

    const responses = await testDestination.testAction('removeProductFromCart', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(202);
    expect(responses[0].data).toMatchObject({success: 'success'});
    expect(responses[0].options.json).toMatchObject({
      productID: '51easf12',
      qty: 2,
      userIdentities: {
        'channels.email.address': 'contact@example.com'
      },
    })
  })
})
