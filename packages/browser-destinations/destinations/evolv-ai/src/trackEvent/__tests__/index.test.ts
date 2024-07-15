import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import evolvDestination, { destination } from '../../index'

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

describe('emit on track', () => {
  const settings = {}

  let trackEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await evolvDestination({
      ...settings,
      subscriptions
    })
    trackEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      window.evolv = {
        client: {
          emit: jest.fn(),
          on: jest.fn(),
          getDisplayName: jest.fn()
        },
        context: {
          update: jest.fn(),
          get: jest.fn()
        }
      }
      return Promise.resolve(window.evolv)
    })
    await trackEvent.load(Context.system(), {} as Analytics)
  })

  test('Track call without parameters', async () => {
    const context = new Context({
      type: 'track',
      event: 'ctaClick'
    })
    await trackEvent.track?.(context)

    expect(window.evolv.client.emit).toHaveBeenCalledWith('segment.ctaClick')
  })

  test('Track call with parameters', async () => {
    const context = new Context({
      type: 'track',
      event: 'ctaClick',
      properties: {}
    })
    await trackEvent.track?.(context)

    expect(window.evolv.client.emit).toHaveBeenCalledWith('segment.ctaClick')
  })
})
