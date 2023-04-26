import { Analytics, Context } from '@segment/analytics-next'
import heapDestination, { destination } from '../index'
import { HEAP_TEST_ENV_ID, mockHeapJsHttpRequest } from '../test-utilities'

const subscriptions = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

describe('Heap', () => {
  test('loading', async () => {
    jest.spyOn(destination, 'initialize')

    mockHeapJsHttpRequest()

    const [event] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap.appid).toEqual(HEAP_TEST_ENV_ID)
  })
  test('loading with cdn', async () => {
    jest.spyOn(destination, 'initialize')

    mockHeapJsHttpRequest()

    const [event] = await heapDestination({
      appId: HEAP_TEST_ENV_ID,
      subscriptions,
      hostname: 'cdn.heapanalytics.com',
      trackingServer: 'https://heapanalytics.com'
    })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap.appid).toEqual(HEAP_TEST_ENV_ID)
  })
})
