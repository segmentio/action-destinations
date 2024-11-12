import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import vwoDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      eventName: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('VWO.trackEvent', () => {
  const settings = {
    vwoAccountId: 654331
  }

  let trackEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await vwoDestination({
      ...settings,
      subscriptions
    })
    trackEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      window.VWO = {
        push: jest.fn(),
        event: jest.fn(),
        visitor: jest.fn()
      }
      return Promise.resolve(window.VWO)
    })
    await trackEvent.load(Context.system(), {} as Analytics)
  })

  test('Track call without parameters', async () => {
    const context = new Context({
      type: 'track',
      event: 'ctaClick'
    })
    await trackEvent.track?.(context)

    expect(window.VWO.event).toHaveBeenCalledWith(
      'segment.ctaClick',
      {},
      {
        source: 'segment.web',
        ogName: 'ctaClick'
      }
    )
  })

  test('Track call with parameters', async () => {
    const context = new Context({
      type: 'track',
      event: 'buyButtonClick',
      properties: {
        amount: 1000
      }
    })
    await trackEvent.track?.(context)

    expect(window.VWO.event).toHaveBeenCalledWith(
      'segment.buyButtonClick',
      {
        amount: 1000
      },
      {
        source: 'segment.web',
        ogName: 'buyButtonClick'
      }
    )
  })
})
