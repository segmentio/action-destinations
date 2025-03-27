import { Analytics, Context } from '@segment/analytics-next'
import replaybird from '../../index'
import {
  trackSubscription,
  REPLAYBIRD_API_KEY,
  createMockedReplaybirdJsSdk,
  mockReplaybirdJsHttpRequest
} from '../../utils'

describe('replaybird.track', () => {
  it('Should send events to replaybird', async () => {
    mockReplaybirdJsHttpRequest()
    window.replaybird = createMockedReplaybirdJsSdk()

    const [event] = await replaybird({
      apiKey: REPLAYBIRD_API_KEY,
      subscriptions: [trackSubscription]
    })

    await event.load(Context.system(), {} as Analytics)
    const trackSpy = jest.spyOn(window.replaybird, 'capture')

    const name = 'Signup'
    const properties = {
      email: 'user@example.com',
      name: 'Mathew',
      country: 'USA'
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
