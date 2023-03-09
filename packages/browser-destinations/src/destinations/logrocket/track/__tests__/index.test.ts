import { Analytics, Context } from '@segment/analytics-next'
import plugins from '../../index'
import LogRocket from 'logrocket'
import { mockWorkerAndXMLHttpRequest, trackSubscription } from '../../test_utilities'

describe('Logrocket.track', () => {
  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)
  it('sends track events to logrocket', async () => {
    const [event] = await plugins({ appID: 'log/rocket', subscriptions: [trackSubscription] })

    await event.load(Context.system(), {} as Analytics)
    const trackSpy = jest.spyOn(LogRocket, 'track')

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

    expect(trackSpy).toHaveBeenCalledWith(name, properties)
  })
})
