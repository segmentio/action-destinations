import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { currency } from 'src/destinations/facebook-conversions-api/fb-capi-properties'

const testDestination = createTestIntegration(Destination)

describe('MolocoRmp.purchase', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        item: {
          id: '123',
          price: 100,
          quantity: 1,
          sellerId: 'seller123',
          itemGroupId: 'itemGroup123'
        },
        currency: 'USD',
        revenue: 100
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
              '@path': '$.properties.currency'
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
})
