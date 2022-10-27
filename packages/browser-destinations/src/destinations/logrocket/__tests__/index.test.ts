import { Analytics, Context } from '@segment/analytics-next'
import plugins, { destination } from '../index'
import { mockWorkerAndXMLHttpRequest, subscriptions } from '../test_utilities'

describe('Logrocket', () => {
  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)

  test('can load', async () => {
    const [event] = await plugins({ appID: 'log/rocket', subscriptions })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window._LRLogger).toBeDefined()
  })
})
