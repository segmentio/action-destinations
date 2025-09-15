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
})
