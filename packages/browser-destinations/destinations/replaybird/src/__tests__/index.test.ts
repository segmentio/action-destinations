import { Analytics, Context } from '@segment/analytics-next'
import replaybird, { destination } from '../index'
import { subscriptions, REPLAYBIRD_SITE_KEY } from '../utils'

describe('Replaybird', () => {
  test('Load replaybird cdn script file', async () => {
    const [event] = await replaybird({
      apiKey: REPLAYBIRD_SITE_KEY,
      subscriptions: subscriptions
    })

    // jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window.replaybird.apiKey).toEqual(REPLAYBIRD_SITE_KEY)
  })
})
