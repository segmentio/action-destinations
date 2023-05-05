import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.updateCart', () => {
  it('throws an error if `email` or `userId` are not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Update Cart',
      userId: null,
      properties: {
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
      testDestination.testAction('updateCart', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('updates the cart when all required fields are present', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'user123',
      event: 'Update Cart',
      properties: {
        products: [
          {
            product_id: '507f1f77bcf86cd799439011',
            name: 'Monopoly: 3rd Edition',
            price: 19,
            quantity: 1
          }
        ]
      }
    })

    nock('https://api.iterable.com/api').post('/commerce/updateCart').reply(200, {})

    const responses = await testDestination.testAction('updateCart', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })

  it('maps all fields correctly', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'user123',
      event: 'Update Cart',
      context: {
        traits: {
          email: 'test@example.com',
          foo: 'baz'
        }
      },
      properties: {
        products: [
          {
            product_id: '507f1f77bcf86cd799439011',
            name: 'Monopoly: 3rd Edition',
            price: 19,
            quantity: 1,
            category: 'Games',
            sku: '45790-32',
            url: 'https://www.example.com/product/path',
            image_url: 'https://www.example.com/product/path.jpg',
            foo: 'bar'
          },
          {
            product_id: '507f1f77bcf86cd799439017',
            name: 'Replacement Monopoly Tokens',
            price: 5,
            quantity: 1,
            url: 'https://www.example.com/product/path',
            color: 'silver',
            size: 'small'
          }
        ]
      }
    })

    nock('https://api.iterable.com/api').post('/commerce/updateCart').reply(200, {})

    const responses = await testDestination.testAction('updateCart', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      user: {
        userId: 'user123',
        email: 'test@example.com',
        dataFields: {
          foo: 'baz'
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
          dataFields: {
            foo: 'bar'
          }
        },
        {
          id: '507f1f77bcf86cd799439017',
          name: 'Replacement Monopoly Tokens',
          price: 5,
          quantity: 1,
          url: 'https://www.example.com/product/path',
          dataFields: {
            color: 'silver',
            size: 'small'
          }
        }
      ]
    })
  })
})
