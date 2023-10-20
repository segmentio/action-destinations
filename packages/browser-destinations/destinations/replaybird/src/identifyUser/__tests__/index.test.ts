import { Analytics, Context } from '@segment/analytics-next'
import replaybird, { destination } from '../../index'
import { identifySubscription, REPLAYBIRD_SITE_KEY } from '../../utils'

describe('replaybird.identify', () => {
  it('send user ID and traits to replaybird', async () => {
    const [identify] = await replaybird({
      apiKey: REPLAYBIRD_SITE_KEY,
      subscriptions: [identifySubscription]
    })

    jest.spyOn(destination.actions.identifyUser, 'perform')
    await identify.load(Context.system(), {} as Analytics)
    const identifySpy = jest.spyOn(window.replaybird, 'identify')

    const userId = 'mathew@gmail.com'
    const traits = {
      name: 'Mathew',
      email: 'mathew@gmail.com'
    }

    await identify.identify?.(
      new Context({
        type: 'identify',
        traits,
        userId
      })
    )
    expect(identifySpy).toHaveBeenCalledWith(userId, traits)
  })
})
