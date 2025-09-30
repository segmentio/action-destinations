import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Topsort.purchase', () => {
  it('should be successful with default mappings and products object', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        products: [
          {
            product_id: '123',
            price: 100,
            quantity: 1
          }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      purchases: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          occurredAt: expect.any(String),
          opaqueUserId: expect.any(String),
          items: [
            {
              productId: '123',
              unitPrice: 100,
              quantity: 1
            }
          ]
        })
      ])
    })
  })

  it('should be successful with default mappings and products object, including brand as vendorId', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        products: [
          {
            product_id: '123',
            price: 100,
            quantity: 1,
            brand: 'v123'
          }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      purchases: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          occurredAt: expect.any(String),
          opaqueUserId: expect.any(String),
          items: [
            {
              productId: '123',
              unitPrice: 100,
              quantity: 1,
              vendorId: 'v123'
            }
          ]
        })
      ])
    })
  })

  it('should be successful with default mappings and products object, including custom vendorId', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        products: [
          {
            product_id: '123',
            price: 100,
            quantity: 1,
            vendorId: 'v123'
          }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      purchases: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          occurredAt: expect.any(String),
          opaqueUserId: expect.any(String),
          items: [
            {
              productId: '123',
              unitPrice: 100,
              quantity: 1,
              vendorId: 'v123'
            }
          ]
        })
      ])
    })
  })

  it('should fail because it misses a required field (products)', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({})

    await expect(
      testDestination.testAction('purchase', {
        event,
        settings: {
          api_key: 'bar'
        },
        useDefaultMappings: true
      })
    ).rejects.toThrowError(AggregateAjvError)
  })

  it('should filter out items with zero price when skipZeroPricePurchases is enabled', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        products: [
          {
            product_id: '123',
            price: 100,
            quantity: 1
          },
          {
            product_id: '456',
            price: 0,
            quantity: 2
          },
          {
            product_id: '789',
            price: 50,
            quantity: 1
          }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        api_key: 'bar',
        skipZeroPricePurchases: true
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      purchases: expect.arrayContaining([
        expect.objectContaining({
          items: [
            {
              productId: '123',
              unitPrice: 100,
              quantity: 1
            },
            {
              productId: '789',
              unitPrice: 50,
              quantity: 1
            }
          ]
        })
      ])
    })
  })

  it('should skip entire purchase when all items have zero price and skipZeroPricePurchases is enabled', async () => {
    const event = createTestEvent({
      properties: {
        products: [
          {
            product_id: '123',
            price: 0,
            quantity: 1
          },
          {
            product_id: '456',
            price: 0,
            quantity: 2
          }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        api_key: 'bar',
        skipZeroPricePurchases: true
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(0)
  })

  it('should send all items including zero price when skipZeroPricePurchases is disabled', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        products: [
          {
            product_id: '123',
            price: 100,
            quantity: 1
          },
          {
            product_id: '456',
            price: 0,
            quantity: 2
          }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        api_key: 'bar',
        skipZeroPricePurchases: false
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      purchases: expect.arrayContaining([
        expect.objectContaining({
          items: [
            {
              productId: '123',
              unitPrice: 100,
              quantity: 1
            },
            {
              productId: '456',
              unitPrice: 0,
              quantity: 2
            }
          ]
        })
      ])
    })
  })
})
