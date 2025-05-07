import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import RedditDestination, { destination } from '../index'
import { RedditPixel } from '../types'

describe('RedditPixel init', () => {
  const settings = {
    pixel_id: 't2_abcd',
    ldu: false
  }

  let mockRdt: RedditPixel
  let reportWebEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockRdt = {
        page: jest.fn(),
        track: jest.fn(),
        init: jest.fn(() => mockRdt)
      }
      return Promise.resolve(mockRdt)
    })
  })

  test('Reddit pixel send Purchase event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          tracking_type: 'Purchase',
          conversion_id: {
            '@path': '$.messageId'
          },
          event_metadata: {
            currency: {
              '@path': '$.properties.currency'
            },
            itemCount: {
              '@path': '$.properties.quantity'
            },
            value: {
              '@path': '$.properties.revenue'
            }
          },
          products: {
            '@arrayPath': [
              '$.properties.products',
              {
                category: { '@path': '$.category' },
                id: { '@path': '$.product_id' },
                name: { '@path': '$.name' }
              }
            ]
          },
          user: {
            advertising_id: {
              '@path': '$.context.device.advertisingId'
            },
            device_type: {
              '@path': '$.context.device.type'
            },
            email: {
              '@path': '$.context.traits.email'
            },
            externalId: {
              '@path': '$.userId'
            },
            phoneNumber: {
              '@path': '$.properties.phone'
            }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      event: 'Order Completed',
      anonymousId: 'anonymousId',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com',
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        },
        device: {
          advertisingId: '38400000-8cf0-11bd-b23e-10b96e40000d',
          type: 'android'
        }
      },
      properties: {
        conversion_id: 'abc12345',
        currency: 'USD',
        quantity: 5,
        revenue: 10.99,
        phone: '14151234',
        products: [
          {
            product_id: '123',
            category: 'food',
            name: 'burrito',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'food',
            name: 'hamburger',
            quantity: 2,
            price: 2
          }
        ]
      }
    })

    const [webEvent] = await RedditDestination({
      ...settings,
      subscriptions
    } as any)
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(mockRdt.track).toHaveBeenCalledWith(
      'Purchase',
      expect.objectContaining({
        conversionId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        aaid: '38400000-8cf0-11bd-b23e-10b96e40000d',
        email: 'test@test.com',
        externalId: 'userId-abc123',
        phoneNumber: '14151234',
        value: 10.99,
        itemCount: 5,
        currency: 'USD',
        products: [
          {
            id: '123',
            category: 'food',
            name: 'burrito'
          },
          {
            id: '456',
            category: 'food',
            name: 'hamburger'
          }
        ]
      })
    )
  })

  test('Reddit pixel send AddToCart event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Add To Cart',
        enabled: true,
        subscribe: 'type = "track" and event = "Product Added"',
        mapping: {
          tracking_type: 'AddToCart',
          conversion_id: {
            '@path': '$.messageId'
          },
          event_metadata: {
            currency: {
              '@path': '$.properties.currency'
            },
            itemCount: {
              '@path': '$.properties.quantity'
            },
            value: {
              '@path': '$.properties.price'
            }
          },
          products: {
            '@arrayPath': [
              '$.properties.products',
              {
                category: { '@path': '$.category' },
                id: { '@path': '$.product_id' },
                name: { '@path': '$.name' }
              }
            ]
          },
          user: {
            advertising_id: {
              '@path': '$.context.device.advertisingId'
            },
            device_type: {
              '@path': '$.context.device.type'
            },
            email: {
              '@path': '$.context.traits.email'
            },
            externalId: {
              '@path': '$.userId'
            },
            phoneNumber: {
              '@path': '$.properties.phone'
            }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      event: 'Product Added',
      anonymousId: 'anonymousId',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com',
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        },
        device: {
          advertisingId: '38400000-8cf0-11bd-b23e-10b96e40000d',
          type: 'android'
        }
      },
      properties: {
        conversion_id: 'abc12345',
        currency: 'USD',
        quantity: 5,
        revenue: 10.99,
        price: 1.99,
        phone: '14151234',
        products: [
          {
            product_id: '123',
            category: 'food',
            name: 'burrito',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'food',
            name: 'hamburger',
            quantity: 2,
            price: 2
          }
        ]
      }
    })

    const [webEvent] = await RedditDestination({
      ...settings,
      subscriptions
    } as any)
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(mockRdt.track).toHaveBeenCalledWith(
      'AddToCart',
      expect.objectContaining({
        conversionId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        aaid: '38400000-8cf0-11bd-b23e-10b96e40000d',
        email: 'test@test.com',
        externalId: 'userId-abc123',
        phoneNumber: '14151234',
        value: 1.99,
        itemCount: 5,
        currency: 'USD',
        products: [
          {
            id: '123',
            category: 'food',
            name: 'burrito'
          },
          {
            id: '456',
            category: 'food',
            name: 'hamburger'
          }
        ]
      })
    )
  })
})
