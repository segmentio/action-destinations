import { Analytics, Context } from '@segment/analytics-next'
import plugins from '../../index'
import { identifySubscription } from '../../__tests__/subscriptions'
import { mockWorkerAndXMLHttpRequest } from '../../__tests__/utilities'

describe('Logrocket.identify', () => {
  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)

  const traits = {
    goodbye: 'moon'
  }

  it('should send user ID and traits to logrocket', async () => {
    const [identify] = await plugins({ appID: 'log/rocket', subscriptions: [identifySubscription] })

    await identify.load(Context.system(), {} as Analytics)
    const logRocket = jest.spyOn(window.LogRocket, 'identify')

    const userId = 'user1'

    await identify.identify?.(
      new Context({
        type: 'identify',
        traits,
        userId
      })
    )

    expect(logRocket).toHaveBeenCalledWith(userId, traits)
  })

  it("shouldn't send an ID if the user is anonymous", async () => {
    const [identify] = await plugins({ appID: 'log/rocket', subscriptions: [identifySubscription] })

    await identify.load(Context.system(), {} as Analytics)
    const logRocket = jest.spyOn(window.LogRocket, 'identify')

    await identify.identify?.(
      new Context({
        type: 'identify',
        traits
      })
    )

    expect(logRocket).toHaveBeenCalledWith(traits)
  })
})
