import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import type { VWO } from '../../types'
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
      },
      page: {
        '@path': '$.context.page'
      }
    }
  }
]

describe('VWO.trackEvent', () => {
  const settings = {
    vwoAccountId: 654331
  }

  let mockVWO: VWO
  let trackEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await vwoDestination({
      ...settings,
      subscriptions
    })
    trackEvent = trackEventPlugin

    // mockVWO = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      // const mockedWithProps = Object.assign(mockVWO as any, settings)
      mockVWO = {
        event: jest.fn()
      }
      return Promise.resolve(mockVWO)
    })
    await trackEvent.load(Context.system(), {} as Analytics)
  })

  test('Track call without parameters', async () => {
    const context = new Context({
      type: 'track',
      event: 'ctaClick'
    })
    await trackEvent.track?.(context)

    expect(mockVWO.event).toHaveBeenCalledWith('ctaClick', {})
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

    expect(mockVWO.event).toHaveBeenCalledWith('buyButtonClick', {
      amount: 1000
    })
  })
})
