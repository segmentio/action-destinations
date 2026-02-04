import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import AppcuesDestination, { destination } from '../../index'
import { Appcues } from '../../types'

describe('Appcues.group', () => {
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

  test('group() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'group',
        name: 'Group',
        enabled: true,
        subscribe: 'type = "group"',
        mapping: {
          groupId: { '@path': '$.groupId' },
          traits: { '@path': '$.traits' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'group',
      anonymousId: 'anonymous-id-123',
      userId: 'user-123',
      groupId: 'group-456',
      traits: {
        name: 'Acme Corp',
        plan: 'enterprise',
        employees: 100
      }
    })

    const [groupEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = groupEvent

    await event.load(Context.system(), {} as Analytics)
    await event.group?.(context)

    expect(mockAppcues.group).toHaveBeenCalledWith('group-456', {
      name: 'Acme Corp',
      plan: 'enterprise',
      employees: 100
    })
  })

  test('group() flattens nested traits', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'group',
        name: 'Group',
        enabled: true,
        subscribe: 'type = "group"',
        mapping: {
          groupId: { '@path': '$.groupId' },
          traits: { '@path': '$.traits' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'group',
      userId: 'user-123',
      groupId: 'group-456',
      traits: {
        name: 'Acme Corp',
        address: {
          city: 'New York',
          country: 'USA'
        },
        industries: ['tech', 'finance']
      }
    })

    const [groupEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = groupEvent

    await event.load(Context.system(), {} as Analytics)
    await event.group?.(context)

    expect(mockAppcues.group).toHaveBeenCalledWith('group-456', {
      name: 'Acme Corp',
      address: {
        city: 'New York',
        country: 'USA'
      },
      industries: 'tech,finance'
    })
  })
})
