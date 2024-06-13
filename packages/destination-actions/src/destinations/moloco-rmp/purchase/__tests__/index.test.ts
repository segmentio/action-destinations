import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('MolocoMCM.purchase', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        item: {
          id: '123',
          price: 100,
          quantity: 1,
          sellerId: 'seller123'
        },
        currency: 'USD',
        revenue: 100
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: {
        platformId: 'foo',
        apiKey: 'bar',
        channel_type: 'SITE',
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
              '@path': '$.properties.currency'
            },
            quantity: {
              '@path': '$.properties.item.quantity'
            },
            sellerId: {
              '@path': '$.properties.item.sellerId'
            }
          }
        ],
        revenue: {
          price: {
            '@path': '$.properties.revenue'
          },
          currency: {
            '@path': '$.properties.currency'
          }
        }
      },
      useDefaultMappings: true,
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should fail to build an event because it misses a required field (items)', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        item: {
          id: '123',
          price: 100,
          quantity: 1,
          sellerId: 'seller123'
        },
        currency: 'USD',
        revenue: 100
      }
    })

    await expect(testDestination.testAction('purchase', {
      event,
      settings: {
        platformId: 'foo',
        apiKey: 'bar',
        channel_type: 'SITE'
      },
      mapping: {
        // items: -- missing mapping for a required field
        revenue: {
          price: {
            '@path': '$.properties.revenue'
          },
          currency: {
            '@path': '$.properties.currency'
          }
        }
      },
      useDefaultMappings: true,
    })).rejects.toThrowError(AggregateAjvError)
  })

})
