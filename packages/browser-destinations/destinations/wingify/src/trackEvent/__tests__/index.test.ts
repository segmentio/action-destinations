import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import wingifyDestination, { destination } from '../../index'

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

describe('Wingify.trackEvent', () => {
  const settings = {
    wingifyAccountId: 654331
  }

  let trackEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await wingifyDestination({
      ...settings,
      subscriptions
    })
    trackEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      window.Wingify = {
        push: jest.fn(),
        event: jest.fn(),
        visitor: jest.fn()
      }
      return Promise.resolve(window.Wingify)
    })
    await trackEvent.load(Context.system(), {} as Analytics)
  })

  test('Track call without parameters', async () => {
    const context = new Context({
      type: 'track',
      event: 'ctaClick'
    })
    await trackEvent.track?.(context)

    expect(window.Wingify.event).toHaveBeenCalledWith(
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

    expect(window.Wingify.event).toHaveBeenCalledWith(
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
