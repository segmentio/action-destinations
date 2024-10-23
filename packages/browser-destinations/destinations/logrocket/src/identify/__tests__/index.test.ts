import { Analytics, Context } from '@segment/analytics-next'
import plugins from '../../index'
import LogRocket from 'logrocket'
import { identifySubscription, mockWorkerAndXMLHttpRequest } from '../../test_utilities'

describe('Logrocket.identify', () => {
  const settings = { appID: 'log/rocket' }

  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)

  const traits = {
    goodbye: 'moon'
  }

  it('should send user ID and traits to logrocket', async () => {
    const [identify] = await plugins({ ...settings, subscriptions: [identifySubscription] })

    await identify.load(Context.system(), {} as Analytics)
    const identifySpy = jest.spyOn(LogRocket, 'identify')

    const userId = 'user1'

    await identify.identify?.(
      new Context({
        type: 'identify',
        traits,
        userId
      })
    )

    expect(identifySpy).toHaveBeenCalledWith(userId, traits)
  })

  it("shouldn't send an ID if the user is anonymous", async () => {
    const [identify] = await plugins({ appID: 'log/rocket', subscriptions: [identifySubscription] })

    await identify.load(Context.system(), {} as Analytics)
    const identifySpy = jest.spyOn(LogRocket, 'identify')

    await identify.identify?.(
      new Context({
        type: 'identify',
        traits
      })
    )

    expect(identifySpy).toHaveBeenCalledWith(traits)
  })
})
