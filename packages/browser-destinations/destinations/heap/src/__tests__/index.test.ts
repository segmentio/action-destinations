import { Analytics, Context } from '@segment/analytics-next'
import heapDestination, { destination } from '../index'
import { HEAP_TEST_ENV_ID } from '../test-utilities'
import { loadScript } from '@segment/browser-destination-runtime/load-script'
import { resolveWhen } from '@segment/browser-destination-runtime/resolve-when'

jest.mock('@segment/browser-destination-runtime/load-script')
jest.mock('@segment/browser-destination-runtime/resolve-when')

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
  beforeAll(() => {
    ;(loadScript as jest.Mock).mockResolvedValue(true)
    ;(resolveWhen as jest.Mock).mockResolvedValue(true)
  })

  beforeEach(() => {
    // Reset global state
    // @ts-expect-error
    delete window.heap
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  test('loading', async () => {
    jest.spyOn(destination, 'initialize')

    const [event] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions })

    await event.load(Context.system(), {} as Analytics)

    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap.appid).toEqual(HEAP_TEST_ENV_ID)
    expect(loadScript).toHaveBeenCalledWith(`https://cdn.us.heap-api.com/config/${HEAP_TEST_ENV_ID}/heap_config.js`)
  })

  test('loading classic SDK with custom hostname', async () => {
    jest.spyOn(destination, 'initialize')

    const [event] = await heapDestination({
      appId: HEAP_TEST_ENV_ID,
      subscriptions,
      hostname: 'cdn.heapanalytics.com',
      trackingServer: 'https://heapanalytics.com'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap.appid).toEqual(HEAP_TEST_ENV_ID)
    expect(loadScript).toHaveBeenCalledWith(`https://cdn.heapanalytics.com/js/heap-${HEAP_TEST_ENV_ID}.js`)
  })

  test('loading latest SDK with custom hostname', async () => {
    jest.spyOn(destination, 'initialize')

    const [event] = await heapDestination({
      appId: HEAP_TEST_ENV_ID,
      subscriptions,
      hostname: 'cdn.heapanalytics.com'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap.appid).toEqual(HEAP_TEST_ENV_ID)
    expect(loadScript).toHaveBeenCalledWith(`https://cdn.heapanalytics.com/config/${HEAP_TEST_ENV_ID}/heap_config.js`)
  })
})
