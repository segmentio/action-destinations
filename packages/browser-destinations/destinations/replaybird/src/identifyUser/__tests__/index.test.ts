import { Analytics, Context } from '@segment/analytics-next'
import replaybird, { destination } from '../../index'
import {
  identifySubscription,
  REPLAYBIRD_API_KEY,
  createMockedReplaybirdJsSdk,
  mockReplaybirdJsHttpRequest
} from '../../utils'

describe('replaybird.identify', () => {
  it('should not call identify if user id is not provided and anonymous user id is provided', async () => {
    mockReplaybirdJsHttpRequest()
    window.replaybird = createMockedReplaybirdJsSdk()

    const [identifyUser] = await replaybird({
      apiKey: REPLAYBIRD_API_KEY,
      subscriptions: [identifySubscription]
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const identifySpy = jest.spyOn(window.replaybird, 'identify')

    const traits = {
      name: 'Mathew',
      email: 'user@example.com'
    }

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        traits
      })
    )

    expect(identifySpy).not.toHaveBeenCalled()
  })

  it('should call identify if user id is provided', async () => {
    mockReplaybirdJsHttpRequest()
    window.replaybird = createMockedReplaybirdJsSdk()

    const [identifyUser] = await replaybird({
      apiKey: REPLAYBIRD_API_KEY,
      subscriptions: [identifySubscription]
    })

    jest.spyOn(destination.actions.identifyUser, 'perform')
    await identifyUser.load(Context.system(), {} as Analytics)
    const identifySpy = jest.spyOn(window.replaybird, 'identify')

    const userId = 'user_123'
    const traits = {
      name: 'Mathew',
      email: 'user@example.com'
    }

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        traits,
        userId
      })
    )
    expect(identifySpy).toHaveBeenCalledWith(userId, traits)
  })
})
