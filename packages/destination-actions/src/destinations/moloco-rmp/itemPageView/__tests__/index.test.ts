import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('MolocoRmp.itemPageView', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        item: {
          id: '123',
          price: 100,
          currency: 'USD',
          quantity: 1,
          sellerId: 'seller123',
          itemGroupId: 'itemGroup123'
        }
      }
    })

    const responses = await testDestination.testAction('itemPageView', {
      event,
      settings: {
        platformId: 'foo',
        apiKey: 'bar'
      },
      mapping: {
        channelType: 'SITE',
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
            },
            itemGroupId: {
              '@path': '$.properties.item.itemGroupId'
            }
          }
        ]
      },
      useDefaultMappings: true,
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
          sellerId: 'seller123',
          itemGroupId: 'itemGroup123'
        }
      }
    })

    await expect(testDestination.testAction('itemPageView', {
      event,
      settings: {
        platformId: 'foo',
        apiKey: 'bar'
      },
      mapping: {
        channelType: 'SITE',
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
        //     itemGroupId: {
        //       '@path': '$.properties.item.itemGroupId'
        //     }
        //   }
        // ] -- missing required field
      },
      useDefaultMappings: true,
    })).rejects.toThrowError(AggregateAjvError)
  })

})
