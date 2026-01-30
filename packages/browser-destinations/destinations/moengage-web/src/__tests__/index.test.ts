import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MoengageDestination from '../index'
import { MoengageSDK } from '../types'
import * as Functions from '../functions'

describe('Moengage Web init', () => {
  const settings = {
    app_id: 'test_app_id',
    env: 'TEST',
    moeDataCenter: 'dc_1'
  }

  let mockMoengage: MoengageSDK
  let trackEventAction: any

  beforeEach(async () => {
    jest.restoreAllMocks()

    // Mock window.moe to simulate SDK loading
    const mockMoe = jest.fn((_config) => {
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
      return mockMoengage
    })

    Object.defineProperty(window, 'moe', {
      writable: true,
      value: mockMoe
    })

    Object.defineProperty(window, 'Moengage', {
      writable: true,
      value: undefined
    })

    // Mock initializeSDK to skip the script loading
    jest.spyOn(Functions, 'initializeSDK').mockResolvedValue(undefined)
  })

  test('Moengage SDK is initialized with correct settings', async () => {
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

    const [trackEvent] = await MoengageDestination({
      ...settings,
      subscriptions
    })

    trackEventAction = trackEvent

    await trackEventAction.load(Context.system(), {} as Analytics)
    expect(Functions.initializeSDK).toHaveBeenCalled()
    expect(window.moe).toHaveBeenCalled()
  })

  test('Moengage analytics.reset calls destroy_session', async () => {
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

    const analytics = {} as Analytics
    const originalReset = jest.fn()
    analytics.reset = originalReset

    const [trackEvent] = await MoengageDestination({
      ...settings,
      subscriptions
    })

    trackEventAction = trackEvent

    await trackEventAction.load(Context.system(), analytics)

    // Call the wrapped reset function
    if (analytics.reset) {
      analytics.reset()
    }

    expect(mockMoengage.destroy_session).toHaveBeenCalled()
    expect(originalReset).toHaveBeenCalled()
  })
})
