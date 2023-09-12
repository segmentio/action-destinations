import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import pendoDestination, { destination } from '../../index'
import { PendoSDK } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'group',
    name: 'Send Group Event',
    enabled: true,
    subscribe: 'type = "group"',
    mapping: {
      visitorId: {
        '@path': '$.userId'
      },
      accountId: {
        '@path': '$.groupId'
      },
      accountData: {
        '@path': '$.traits'
      }
    }
  }
]

describe('Pendo.group', () => {
  const settings = {
    apiKey: 'abc123',
    setVisitorIdOnLoad: 'disabled',
    region: 'io'
  }

  let mockPendo: PendoSDK
  let groupAction: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [groupEvent] = await pendoDestination({
      ...settings,
      subscriptions
    })
    groupAction = groupEvent

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockPendo = {
        initialize: jest.fn(),
        isReady: jest.fn(),
        track: jest.fn(),
        identify: jest.fn()
      }
      return Promise.resolve(mockPendo)
    })
    await groupAction.load(Context.system(), {} as Analytics)
  })

  test('calls the pendo Client identify() function', async () => {
    const context = new Context({
      type: 'group',
      userId: 'testUserId',
      traits: {
        company_name: 'Megacorp 2000'
      },
      groupId: 'company_id_1'
    })
    await groupAction.group?.(context)

    expect(mockPendo.identify).toHaveBeenCalledWith({
      account: { id: 'company_id_1', company_name: 'Megacorp 2000' },
      visitor: { id: 'testUserId' }
    })
  })
})
