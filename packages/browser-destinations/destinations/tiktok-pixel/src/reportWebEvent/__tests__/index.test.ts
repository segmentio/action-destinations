import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import TikTokDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'

// import { loadScript } from '@segment/browser-destination-runtime/load-script'

describe('ttq.track', () => {
  test('it maps "PlaceAnOrder" event name and properties and passes them into TikTokDestination.reportWebEvent', async () => {
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

    window.ttq = {
      identify: jest.fn().mockResolvedValueOnce(undefined),
      track: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as TikTokPixel

    const [event] = await TikTokDestination({
      subscriptions,
      pixelCode: '123',
      useExistingPixel: false
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.reportWebEvent.perform, 'perform')

    await event.track?.(
      new Context({
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
            }
          ],
          query: 'test-query',
          value: 10,
          currency: 'USD',
          phone: '+12345678900',
          email: 'aaa@aaa.com'
        }
      })
    )

    expect(destination.actions.reportWebEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          event: 'PlaceAnOrder',
          properties: {
            products: [
              {
                content_id: '123',
                content_type: 'product',
                quantity: 1,
                price: 1
              }
            ],
            query: 'test-query',
            value: 10,
            currency: 'USD',
            phone: '+12345678900',
            email: 'aaa@aaa.com'
          }
        }
      })
    )
  })

  test('it maps "ViewContent" event name and properties and passes them into TikTokDestination.reportWebEvent', async () => {
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
          event: {
            '@path': 'ViewContent'
          },
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
          }
        }
      }
    ]

    window.ttq = {
      identify: jest.fn().mockResolvedValueOnce(undefined),
      track: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as TikTokPixel

    const [event] = await TikTokDestination({
      subscriptions,
      pixelCode: '123',
      useExistingPixel: false
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.reportWebEvent.perform, 'perform')

    await event.page?.(
      new Context({
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        type: 'page',
        anonymousId: 'anonymousId',
        event: 'View Content',
        properties: {
          content_id: '123',
          content_type: 'product',
          quantity: 1,
          price: 1,
          query: 'test-query',
          value: 10,
          currency: 'USD',
          phone: '+12345678900',
          email: 'aaa@aaa.com'
        }
      })
    )

    expect(destination.actions.reportWebEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          event: 'ViewContent',
          properties: {
            content_id: '123',
            content_type: 'product',
            quantity: 1,
            price: 1,
            query: 'test-query',
            value: 10,
            currency: 'USD',
            phone: '+12345678900',
            email: 'aaa@aaa.com'
          }
        }
      })
    )
  })

  test('it maps "AddToCart" event name and properties and passes them into TikTokDestination.reportWebEvent', async () => {
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
          event: {
            '@path': 'AddToCart'
          },
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
          }
        }
      }
    ]

    window.ttq = {
      identify: jest.fn().mockResolvedValueOnce(undefined),
      track: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as TikTokPixel

    const [event] = await TikTokDestination({
      subscriptions,
      pixelCode: '123',
      useExistingPixel: false
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.reportWebEvent.perform, 'perform')

    await event.page?.(
      new Context({
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        type: 'track',
        anonymousId: 'anonymousId',
        event: 'Add to Cart',
        properties: {
          content_id: '123',
          content_type: 'product',
          quantity: 1,
          price: 1,
          query: 'test-query',
          value: 10,
          currency: 'USD',
          phone: '+12345678900',
          email: 'aaa@aaa.com'
        }
      })
    )

    expect(destination.actions.reportWebEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          event: 'AddToCart',
          properties: {
            content_id: '123',
            content_type: 'product',
            quantity: 1,
            price: 1,
            query: 'test-query',
            value: 10,
            currency: 'USD',
            phone: '+12345678900',
            email: 'aaa@aaa.com'
          }
        }
      })
    )
  })
})
