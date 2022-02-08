import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      }
    }
  }
]

describe('trackEvent', () => {
  test('it maps event parameters correctly to track function ', async () => {
    const [trackEvent] = await sprigWebDestination({
      envId: 'testEnvId',
      subscriptions
    })

    destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    await trackEvent.load(Context.system(), {} as Analytics)

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked',
        anonymousId: 'anonymous-id-0'
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { name: 'Button Clicked', anonymousId: 'anonymous-id-0' }
      })
    )
  })
})
