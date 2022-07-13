import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import intercomDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event_name: {
        '@path': '$.event'
      },
      event_metadata: {
        '@path': '$.properties'
      },
      price: {
        amount: { '@path': '$.properties.revenue' },
        currency: { '@path': '$.properties.currency' }
      }
    }
  }
]

describe('Intercom.trackEvent', () => {
  test("invokes intercom's trackEvent API", async () => {
    const [trackEvent] = await intercomDestination({
      appId: 'topSecretKey',
      subscriptions
    })

    destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')

    await trackEvent.load(Context.system(), {} as Analytics)
    await trackEvent.track?.(
      new Context({
        type: 'track',
        event: 'surfboard-bought',
        properties: {
          surfer: 'kelly slater',
          board: 'wavestorm',
          revenue: 100,
          currency: 'USD'
        }
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        payload: {
          event_name: 'surfboard-bought',
          price: {
            amount: 100,
            currency: 'USD'
          },
          event_metadata: {
            board: 'wavestorm',
            currency: 'USD',
            revenue: 100,
            surfer: 'kelly slater'
          }
        }
      })
    )
  })
})
