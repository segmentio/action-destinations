import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import pendoDestination, { destination } from '../../index'
import { PendoSDK } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identify',
    name: 'Send Identify Event',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      visitorId: {
        '@path': '$.userId'
      },
      visitorData: {
        '@path': '$.traits'
      }
    }
  }
]

describe('Pendo.identify', () => {
  const settings = {
    apiKey: 'abc123',
    region: 'io'
  }

  let mockPendo: PendoSDK
  let identifyAction: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyEvent] = await pendoDestination({
      ...settings,
      subscriptions
    })
    identifyAction = identifyEvent

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockPendo = {
        initialize: jest.fn(),
        isReady: jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        flushNow: jest.fn()
      }
      return Promise.resolve(mockPendo)
    })
    await identifyAction.load(Context.system(), {} as Analytics)
  })

  test('calls the pendo Client identify() function', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'testUserId',
      traits: {
        first_name: 'Jimbo'
      }
    })
    await identifyAction.identify?.(context)

    expect(mockPendo.identify).toHaveBeenCalledWith({
      visitor: { first_name: 'Jimbo', id: 'testUserId' }
    })
  })
})
