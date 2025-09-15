import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import TikTokDestination, { destination } from '../index'
import { TikTokPixel } from '../types'

describe('TikTokPixel init', () => {
  const settings = {
    pixelCode: '1234',
    autoPageView: true,
    useExistingPixel: false
  }

  let mockTtp: TikTokPixel
  let reportWebEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockTtp = {
        page: jest.fn(),
        identify: jest.fn(),
        track: jest.fn(),
        instance: jest.fn(() => mockTtp)
      }
      return Promise.resolve(mockTtp)
    })
  })

  test('TikTok pixel send Pageview event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'event = "Order Completed"',
        mapping: {
          event_id: {
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
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'PlaceAnOrder',
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
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
  })
})
