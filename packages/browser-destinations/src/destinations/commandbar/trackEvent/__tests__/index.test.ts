import { Analytics, Context } from '@segment/analytics-next'
import commandBarDestination, { destination } from '../../index'

describe('Commandbar.trackEvent', () => {
  it('Sends events to CommandBar', async () => {
    const [identifyUserPlugin] = await commandBarDestination({
      orgId: '05f077f2',
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            event_metadata: {
              '@path': '$.properties'
            }
          }
        }
      ]
    })

    destination.actions.trackEvent.perform = jest.fn()
    const trackSpy = jest.spyOn(destination.actions.trackEvent, 'perform')
    await identifyUserPlugin.load(Context.system(), {} as Analytics)

    await identifyUserPlugin.track?.(
      new Context({
        type: 'track',
        event: 'example-event',
        properties: {
          foo: 'bar'
        }
      })
    )

    expect(trackSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          event_name: 'example-event',
          event_metadata: {
            foo: 'bar'
          }
        }
      })
    )
  })
})
