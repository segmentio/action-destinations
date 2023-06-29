import type { Subscription } from '../../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import TikTokDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'

import { loadScript } from '../../../../runtime/load-script'

jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('ttq.track', () => {
  test('it maps the event name and properties and passes them into RipeSDK.track', async () => {
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
      init: jest.fn().mockResolvedValueOnce('123'),
      setIds: jest.fn().mockResolvedValueOnce(undefined),
      track: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as TikTokPixel

    const [event] = await TikTokDestination({
      subscriptions,
      pixelCode: '123',
      useExistingPixel: false
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.track, 'perform')

    await event.track?.(
      new Context({
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        type: 'track',
        anonymousId: 'anonymousId',
        event: 'Order Completed',
        properties: {
          products: [],
          query: 'test-query',
          value: 10,
          currency: 'USD',
          phone: '+12345678900',
          email: 'aaa@aaa.com'
        }
      })
    )

    expect(destination.actions.track.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          anonymousId: 'anonymousId',
          userId: undefined,
          groupId: undefined,
          event: 'Form Submitted',
          properties: {
            products: [],
            query: 'test-query',
            value: 10,
            currency: 'USD',
            phone: '+12345678900',
            email: 'aaa@aaa.com'
          }
        }
      })
    )

    expect(window.ttq.track).toHaveBeenCalledWith({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      anonymousId: 'anonymousId',
      userId: undefined,
      groupId: undefined,
      event: 'Form Submitted',
      properties: expect.objectContaining({
        products: [],
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: '+12345678900',
        email: 'aaa@aaa.com'
      })
    })
  })
})
