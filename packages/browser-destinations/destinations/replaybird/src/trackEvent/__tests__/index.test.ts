import { Analytics, Context } from '@segment/analytics-next'
import replaybird, { destination } from '../../index'
import { trackSubscription, REPLAYBIRD_SITE_KEY } from '../../utils'

describe('replaybird.track', () => {
  it('Send events to replaybird', async () => {
    const [event] = await replaybird({
      apiKey: REPLAYBIRD_SITE_KEY,
      subscriptions: [trackSubscription]
    })

    jest.spyOn(destination.actions.trackEvent, 'perform')
    // jest.spyOn(destination, 'initialize')
    await event.load(Context.system(), {} as Analytics)

    const trackSpy = jest.spyOn(window.replaybird, 'capture')
    const name = 'signup'
    const properties = {
      userName: 'mathew'
    }

    await event.track?.(
      new Context({
        type: 'track',
        name,
        properties
      })
    )
    expect(trackSpy).toHaveBeenCalledWith(name, properties)
  })
})
