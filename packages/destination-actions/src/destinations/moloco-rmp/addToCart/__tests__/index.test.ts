import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('MolocoMCM.addToCart', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        item: {
          id: '123',
          price: 100,
          currency: 'USD',
          quantity: 1,
          sellerId: 'seller123'
        }
      }
    })

    const responses = await testDestination.testAction('addToCart', {
      event,
      settings: {
        platformId: 'foo',
        platformName: 'foo',
        apiKey: 'bar',
        channel_type: 'SITE'
      },
      mapping: {
        timestamp: { '@path': '$.timestamp' },
        items: [
          {
            id: {
              '@path': '$.properties.item.id'
            },
            price: {
              '@path': '$.properties.item.price'
            },
            currency: {
              '@path': '$.properties.item.currency'
            },
            quantity: {
              '@path': '$.properties.item.quantity'
            },
            sellerId: {
              '@path': '$.properties.item.sellerId'
            }
          }
        ]
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should fail to build an event because it misses a required field', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        item: {
          id: '123',
          price: 100,
          currency: 'USD',
          quantity: 1,
          sellerId: 'seller123'
        }
      }
    })

    await expect(
      testDestination.testAction('addToCart', {
        event,
        settings: {
          platformId: 'foo',
          platformName: 'foo',
          apiKey: 'bar',
          channel_type: 'SITE'
        },
        mapping: {
          // items: [
          //   {
          //     id: {
          //       '@path': '$.properties.item.id'
          //     },
          //     price: {
          //       '@path': '$.properties.item.price'
          //     },
          //     currency: {
          //       '@path': '$.properties.item.currency'
          //     },
          //     quantity: {
          //       '@path': '$.properties.item.quantity'
          //     },
          //     sellerId: {
          //       '@path': '$.properties.item.sellerId'
          //     },
          //   }
          // ] -- missing required field
        },
        useDefaultMappings: true
      })
    ).rejects.toThrowError(AggregateAjvError)
  })
})
