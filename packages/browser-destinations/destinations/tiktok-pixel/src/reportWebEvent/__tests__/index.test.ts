import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import TikTokDestination, { destination } from '../../index'
// import { TikTokPixel } from '../../types'

describe('TikTokPixel.reportWebEvent', () => {
  const settings = {
    pixelCode: '1234',
    useExistingPixel: false
  }

  let reportWebEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()
  })

  test('maps properties correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'event = "Order Completed"',
        mapping: {
          messageId: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: {
            '@path': 'PlaceAnOrder'
          },
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      event: 'Order Completed',
      properties: {
        products: [
          {
            content_id: '123',
            content_type: 'product',
            quantity: 1,
            price: 1
          },
          {
            content_id: '456',
            content_type: 'product',
            quantity: 2,
            price: 2
          }
        ],
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: '+12345678900',
        email: 'aaa@aaa.com',
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    jest.spyOn(destination.actions.reportWebEvent, 'perform')
    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(destination.actions.reportWebEvent.perform).toHaveBeenCalledWith([
      ['page'],
      ['identify', { email: 'aaa@aaa.com', phone_number: '+12345678900' }],
      [
        'track',
        'PlaceAnOrder',
        {
          contents: [
            { price: 1, quantity: 1 },
            { price: 2, quantity: 2 }
          ],
          currency: 'USD',
          description: 'test-description',
          query: 'test-query',
          value: 10
        }
      ]
    ])
  })
})
