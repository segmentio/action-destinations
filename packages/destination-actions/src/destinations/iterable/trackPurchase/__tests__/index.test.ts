import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.trackPurchase', () => {
  it('throws an error if `email` or `userId` are not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      userId: null,
      properties: {
        total: 19.0,
        products: [
          {
            name: 'Monopoly: 3rd Edition',
            price: 19,
            quantity: 1,
            product_id: '123123'
          }
        ]
      }
    })

    await expect(
      testDestination.testAction('trackPurchase', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('works with default mappings', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      userId: 'user123',
      context: {
        traits: {
          email: 'test@example.com',
          phone: '+14158675309'
        }
      },
      properties: {
        total: 19.0,
        products: [
          {
            product_id: '507f1f77bcf86cd799439011',
            name: 'Monopoly: 3rd Edition',
            price: 19,
            quantity: 1,
            category: 'Games',
            sku: '45790-32',
            url: 'https://www.example.com/product/path',
            image_url: 'https://www.example.com/product/path.jpg'
          }
        ]
      }
    })

    nock('https://api.iterable.com/api').post('/commerce/trackPurchase').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].options.json).toMatchObject({
      user: {
        userId: 'user123',
        email: 'test@example.com',
        dataFields: {
          phoneNumber: '+14158675309'
        }
      },
      items: [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Monopoly: 3rd Edition',
          price: 19,
          quantity: 1,
          sku: '45790-32',
          categories: ['Games'],
          url: 'https://www.example.com/product/path',
          imageUrl: 'https://www.example.com/product/path.jpg',
          dataFields: {}
        }
      ]
    })
  })
})
