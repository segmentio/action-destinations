import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import AppcuesDestination, { destination } from '../../index'
import { Appcues } from '../../types'

describe('Appcues.identify', () => {
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

  test('identify() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identify',
        name: 'Identify',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          userId: { '@path': '$.userId' },
          traits: { '@path': '$.traits' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      anonymousId: 'anonymous-id-123',
      userId: 'user-123',
      traits: {
        name: 'John Doe',
        email: 'john@example.com',
        plan: 'premium',
        age: 30
      }
    })

    const [identifyEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = identifyEvent

    await event.load(Context.system(), {} as Analytics)
    await event.identify?.(context)

    expect(mockAppcues.identify).toHaveBeenCalledWith('user-123', {
      name: 'John Doe',
      email: 'john@example.com',
      plan: 'premium',
      age: 30
    })
  })

  test('identify() flattens nested traits', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identify',
        name: 'Identify',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          userId: { '@path': '$.userId' },
          traits: { '@path': '$.traits' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-123',
      traits: {
        name: 'John Doe',
        address: {
          city: 'San Francisco',
          state: 'CA'
        },
        tags: ['vip', 'beta']
      }
    })

    const [identifyEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = identifyEvent

    await event.load(Context.system(), {} as Analytics)
    await event.identify?.(context)

    expect(mockAppcues.identify).toHaveBeenCalledWith('user-123', {
      name: 'John Doe',
      address: {
        city: 'San Francisco',
        state: 'CA'
      },
      tags: 'vip,beta'
    })
  })
})
