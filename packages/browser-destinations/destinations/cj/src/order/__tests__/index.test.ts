import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import CJDestination, { destination } from '../../index'
import { CJ } from '../../types'
import * as sendModule from '../../utils'
import * as orderModule from '../utils'

describe('CJ init', () => {
  const settings = {
    tagId: '123456789',
    actionTrackerId: '987654321'
  }

  const testCookieName = 'cjeventOrder'
  let mockCJ: CJ
  let orderEvent: any
  beforeEach(async () => {
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockCJ = {} as CJ
      return Promise.resolve(mockCJ)
    })

    document.cookie = `${testCookieName}=testcCookieValue`

    jest.spyOn(sendModule, 'send').mockImplementation(() => {
      return Promise.resolve()
    })

    jest.spyOn(orderModule, 'setOrderJSON') // <-- just spying, not mocking
    
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('CJ pixel order event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          }
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ]
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
        trackingSource: 'Segment',
        userId: 'userId-abc123',
        enterpriseId: 999999,
        pageType: 'conversionConfirmation',
        emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
        orderId: 'abc12345',
        actionTrackerId: "987654321",
        currency: 'USD',
        amount: 10.99,
        discount: 1,
        coupon: 'COUPON1',
        cjeventOrder: 'testcCookieValue',
        items:[
          {
            itemId: '123',
            quantity: 1,
            itemPrice: 1,
            discount: 0.5
          },
          {
            itemId: '456',
            quantity: 2,
            itemPrice: 2,
            discount: 0
          }
        ]
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      expect.any(Object), 
      expect.objectContaining(orderJSON)
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.order).toBe(undefined)
  })
})
