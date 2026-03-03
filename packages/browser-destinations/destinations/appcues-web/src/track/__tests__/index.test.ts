import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import AppcuesDestination, { destination } from '../../index'
import { Appcues } from '../../types'

describe('Appcues.track', () => {
  const settings = {
    accountID: 'test-account-id',
    region: 'US' as const,
    enableURLDetection: true
  }

  let mockAppcues: Appcues
  let event: any

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockAppcues = {
        track: jest.fn(),
        identify: jest.fn(),
        group: jest.fn(),
        page: jest.fn()
      }
      return Promise.resolve(mockAppcues)
    })
  })

  test('track() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'track',
        name: 'Track',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'track',
      event: 'Button Clicked',
      anonymousId: 'anonymous-id-123',
      userId: 'user-123',
      properties: {
        buttonName: 'Sign Up',
        color: 'blue',
        position: 'header'
      }
    })

    const [trackEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = trackEvent

    await event.load(Context.system(), {} as Analytics)
    await event.track?.(context)

    expect(mockAppcues.track).toHaveBeenCalledWith('Button Clicked', {
      buttonName: 'Sign Up',
      color: 'blue',
      position: 'header'
    })
  })

  test('track() handles nested properties and arrays', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'track',
        name: 'Track',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          event: { '@path': '$.event' },
          properties: { '@path': '$.properties' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'track',
      event: 'Purchase Completed',
      userId: 'user-123',
      properties: {
        total: 99.99,
        items: [
          { name: 'Product A', price: 49.99 },
          { name: 'Product B', price: 50.0 }
        ],
        shipping: {
          method: 'express',
          cost: 10
        }
      }
    })

    const [trackEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = trackEvent

    await event.load(Context.system(), {} as Analytics)
    await event.track?.(context)

    expect(mockAppcues.track).toHaveBeenCalledWith('Purchase Completed', {
      total: 99.99,
      items: [
        { name: 'Product A', price: 49.99 },
        { name: 'Product B', price: 50.0 }
      ],
      shipping: {
        method: 'express',
        cost: 10
      }
    })
  })
})
