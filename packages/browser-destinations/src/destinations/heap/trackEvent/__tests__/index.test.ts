import { Analytics, Context, Plugin } from '@segment/analytics-next'
import heapDestination from '../../index'
import {
  createMockedHeapJsSdk,
  HEAP_TEST_ENV_ID,
  mockHeapJsHttpRequest,
  trackEventSubscription
} from '../../test-utilities'
import { HEAP_SEGMENT_BROWSER_LIBRARY_NAME } from '../../constants'

describe('#trackEvent', () => {
  const createHeapDestinationAndSpy = async (): Promise<[Plugin, jest.SpyInstance]> => {
    mockHeapJsHttpRequest()
    window.heap = createMockedHeapJsSdk()

    const [event] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [trackEventSubscription] })

    await event.load(Context.system(), {} as Analytics)
    const heapTrackSpy = jest.spyOn(window.heap, 'track')

    return [event, heapTrackSpy]
  }
  it('sends events to heap', async () => {
    const [event, heapTrackSpy] = await createHeapDestinationAndSpy()
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      banana: '📞',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
  })

  it('should send segment_library property if no other properties were provided', async () => {
    const [event, heapTrackSpy] = await createHeapDestinationAndSpy()
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!'
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
  })

  it('should not override segment_library property value if provided by user', async () => {
    const [event, heapTrackSpy] = await createHeapDestinationAndSpy()
    const segmentLibraryValue = 'user-provided-value'
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          segment_library: segmentLibraryValue
        }
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
  })
})
