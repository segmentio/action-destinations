import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

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
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('trackEvent', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
  })
  test('it maps event parameters correctly to track function ', async () => {
    const [trackEvent] = await sprigWebDestination({
      envId: 'testEnvId',
      subscriptions
    })

    destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    await trackEvent.load(Context.system(), {} as Analytics)
    const properties = { property1: 'value1', property2: false }
    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked',
        anonymousId: 'anonymous-id-0',
        properties
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { name: 'Button Clicked', anonymousId: 'anonymous-id-0', properties }
      })
    )
  })
})
