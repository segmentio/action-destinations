import { Analytics, Context } from '@segment/analytics-next'
import plugins from '../../index'
import { trackSubscription } from '../../__tests__/subscriptions'
import { mockWorkerAndXMLHttpRequest } from '../../__tests__/utilities'

describe('Logrocket.track', () => {
  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)
  it('sends track events to logrocket', async () => {
    const [event] = await plugins({ appID: 'log/rocket', subscriptions: [trackSubscription] })

    await event.load(Context.system(), {} as Analytics)
    const logRocket = jest.spyOn(window.LogRocket, 'track')

    const name = 'testName'
    const properties = {
      goodbye: 'moon'
    }

    await event.track?.(
      new Context({
        type: 'track',
        name,
        properties
      })
    )

    expect(logRocket).toHaveBeenCalledWith(name, properties)
  })
})
