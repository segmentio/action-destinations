import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MoengageDestination from '../index'
import { MoengageSDK } from '../types'
import * as Functions from '../functions'

describe('Moengage Web init', () => {
  const settings = {
    appId: 'test_app_id',
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
        initialized: true,
        trackEvent: jest.fn(),
        setUserAttribute: jest.fn(),
        setFirstName: jest.fn(),
        setLastName: jest.fn(),
        setEmailId: jest.fn(),
        setMobileNumber: jest.fn(),
        setUserName: jest.fn(),
        setGender: jest.fn(),
        setBirthDate: jest.fn(),
        logoutUser: jest.fn(),
        callWebPush: jest.fn(),
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

  test('Moengage analytics.reset calls logoutUser', async () => {
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

    expect(mockMoengage.logoutUser).toHaveBeenCalled()
    expect(originalReset).toHaveBeenCalled()
  })
})
