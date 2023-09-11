import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import pendoDestination, { destination } from '../../index'
import { PendoSDK } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'track',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event: {
        '@path': '$.event'
      },
      metadata: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Pendo.track', () => {
  const settings = {
    apiKey: 'abc123',
    setVisitorIdOnLoad: 'disabled',
    region: 'io'
  }

  let mockPendo: PendoSDK
  let trackAction: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEvent] = await pendoDestination({
      ...settings,
      subscriptions
    })
    trackAction = trackEvent

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockPendo = {
        initialize: jest.fn(),
        isReady: jest.fn(),
        track: jest.fn(),
        identify: jest.fn()
      }
      return Promise.resolve(mockPendo)
    })
    await trackAction.load(Context.system(), {} as Analytics)
  })

  test('calls the pendo Client track() function', async () => {
    const context = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        test: 'hello'
      }
    })
    await trackAction.track?.(context)

    expect(mockPendo.track).toHaveBeenCalledWith('Test Event', { test: 'hello' })
  })
})
