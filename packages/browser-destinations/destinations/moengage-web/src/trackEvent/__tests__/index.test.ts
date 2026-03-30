import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MoengageDestination, { destination } from '../../index'
import { MoengageSDK } from '../../types'

describe('Moengage.trackEvent', () => {
  const settings = {
    app_id: 'test_app_id',
    env: 'TEST',
    moeDataCenter: 'dc_1'
  }

  let mockMoengage: MoengageSDK
  let trackEventAction: any

  beforeEach(async () => {
    jest.restoreAllMocks()

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockMoengage = {
        track_event: jest.fn(),
        add_user_attribute: jest.fn(),
        add_first_name: jest.fn(),
        add_last_name: jest.fn(),
        add_email: jest.fn(),
        add_mobile: jest.fn(),
        add_user_name: jest.fn(),
        add_gender: jest.fn(),
        add_birthday: jest.fn(),
        destroy_session: jest.fn(),
        call_web_push: jest.fn(),
        identifyUser: jest.fn(),
        getUserIdentities: jest.fn(),
        onsite: jest.fn()
      }
      return Promise.resolve(mockMoengage)
    })
  })

  test('trackEvent() sends event with properties', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'trackEvent',
        name: 'Track Event',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          event_name: { '@path': '$.event' },
          attributes: { '@path': '$.properties' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'track',
      event: 'Product Viewed',
      anonymousId: 'anonymous-id-123',
      userId: 'user-id-456',
      properties: {
        product_id: 'prod-123',
        product_name: 'Blue Widget',
        price: 19.99,
        currency: 'USD',
        category: 'Widgets'
      }
    })

    const [trackEvent] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    trackEventAction = trackEvent

    await trackEventAction.load(Context.system(), {} as Analytics)
    await trackEventAction.track?.(context)

    expect(mockMoengage.track_event).toHaveBeenCalledWith('Product Viewed', {
      product_id: 'prod-123',
      product_name: 'Blue Widget',
      price: 19.99,
      currency: 'USD',
      category: 'Widgets'
    })
  })

  test('trackEvent() sends event without properties', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'trackEvent',
        name: 'Track Event',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          event_name: { '@path': '$.event' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'track',
      event: 'Button Clicked',
      anonymousId: 'anonymous-id-123'
    })

    const [trackEvent] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    trackEventAction = trackEvent

    await trackEventAction.load(Context.system(), {} as Analytics)
    await trackEventAction.track?.(context)

    expect(mockMoengage.track_event).toHaveBeenCalledWith('Button Clicked', {})
  })

  test('trackEvent() sends complex nested properties', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'trackEvent',
        name: 'Track Event',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          event_name: { '@path': '$.event' },
          attributes: { '@path': '$.properties' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'track',
      event: 'Order Completed',
      userId: 'user-id-789',
      properties: {
        order_id: 'order-abc-123',
        total: 99.99,
        items: [
          { id: 'item-1', name: 'Widget', price: 49.99 },
          { id: 'item-2', name: 'Gadget', price: 50.00 }
        ],
        shipping: {
          method: 'express',
          cost: 10.00
        }
      }
    })

    const [trackEvent] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    trackEventAction = trackEvent

    await trackEventAction.load(Context.system(), {} as Analytics)
    await trackEventAction.track?.(context)

    expect(mockMoengage.track_event).toHaveBeenCalledWith('Order Completed', {
      order_id: 'order-abc-123',
      total: 99.99,
      items: [
        { id: 'item-1', name: 'Widget', price: 49.99 },
        { id: 'item-2', name: 'Gadget', price: 50.00 }
      ],
      shipping: {
        method: 'express',
        cost: 10.00
      }
    })
  })
})
