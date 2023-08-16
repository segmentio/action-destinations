import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import TikTokDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'

describe('TikTokPixel.reportWebEvent', () => {
  const settings = {
    pixelCode: '1234',
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
        track: jest.fn()
      }
      return Promise.resolve(mockTtp)
    })
  })

  test('maps properties correctly for "PlaceAnOrder" event', async () => {
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

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      event: 'Order Completed',
      properties: {
        products: [
          {
            product_id: '123',
            category: 'product',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'product',
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

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      email: 'aaa@aaa.com',
      phone_number: '+12345678900'
    })
    expect(mockTtp.track).toHaveBeenCalledWith('PlaceAnOrder', {
      contents: [
        { content_id: '123', content_type: 'product', price: 1, quantity: 1 },
        { content_id: '456', content_type: 'product', price: 2, quantity: 2 }
      ],
      currency: 'USD',
      description: 'test-description',
      query: 'test-query',
      value: 10
    })
  })

  test('maps properties correctly for "AddToCart" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Add to Cart',
        enabled: true,
        subscribe: 'event = "Product Added"',
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
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
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

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      event: 'Product Added',
      properties: {
        product_id: '123',
        category: 'product',
        quantity: 1,
        price: 1,
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

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      email: 'aaa@aaa.com',
      phone_number: '+12345678900'
    })
    expect(mockTtp.track).toHaveBeenCalledWith('AddToCart', {
      contents: [{ content_id: '123', content_type: 'product', price: 1, quantity: 1 }],
      currency: 'USD',
      description: 'test-description',
      query: 'test-query',
      value: 10
    })
  })

  test('maps properties correctly for "ViewContent" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'View Content',
        enabled: true,
        subscribe: 'type="page"',
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
          event: 'ViewContent',
          contents: {
            '@arrayPath': [
              '$.properties',
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

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      properties: {
        product_id: '123',
        category: 'product',
        quantity: 1,
        price: 1,
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

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      email: 'aaa@aaa.com',
      phone_number: '+12345678900'
    })
    expect(mockTtp.track).toHaveBeenCalledWith('ViewContent', {
      contents: [{ content_id: '123', content_type: 'product', price: 1, quantity: 1 }],
      currency: 'USD',
      description: 'test-description',
      query: 'test-query',
      value: 10
    })
  })
})
