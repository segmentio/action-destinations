import { Analytics, Context } from '@segment/analytics-next'
import replaybird, { destination } from '../index'
import { subscriptions, REPLAYBIRD_API_KEY, mockReplaybirdJsHttpRequest, createMockedReplaybirdJsSdk } from '../utils'

describe('Replaybird', () => {
  test('Load replaybird cdn script file', async () => {
    jest.spyOn(destination, 'initialize')

    mockReplaybirdJsHttpRequest()
    window.replaybird = createMockedReplaybirdJsSdk()

    const [event] = await replaybird({
      apiKey: REPLAYBIRD_API_KEY,
      subscriptions: subscriptions
    })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window.replaybird.apiKey).toEqual(REPLAYBIRD_API_KEY)
  })
})
