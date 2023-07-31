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
  let event: Plugin
  let heapTrackSpy: jest.SpyInstance
  let addUserPropertiesSpy: jest.SpyInstance
  let identifySpy: jest.SpyInstance

  beforeAll(async () => {
    mockHeapJsHttpRequest()
    window.heap = createMockedHeapJsSdk()

    event = (await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [trackEventSubscription] }))[0]

    await event.load(Context.system(), {} as Analytics)
    heapTrackSpy = jest.spyOn(window.heap, 'track')
    addUserPropertiesSpy = jest.spyOn(window.heap, 'addUserProperties')
    identifySpy = jest.spyOn(window.heap, 'identify')
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('sends events to heap', async () => {
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
    expect(addUserPropertiesSpy).toHaveBeenCalledTimes(0)
    expect(identifySpy).toHaveBeenCalledTimes(0)
  })

  it('should send segment_library property if no other properties were provided', async () => {
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!'
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(addUserPropertiesSpy).toHaveBeenCalledTimes(0)
    expect(identifySpy).toHaveBeenCalledTimes(0)
  })

  it('should not override segment_library property value if provided by user', async () => {
    const segmentLibraryValue = 'user-provided-value'
    const userId = 'TEST_ID77'
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          segment_library: segmentLibraryValue
        },
        userId
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(identifySpy).toHaveBeenCalledWith(userId)
    expect(addUserPropertiesSpy).toHaveBeenCalledTimes(0)
  })

  it('should add traits', async () => {
    const segmentLibraryValue = 'test123'
    const anonymous_id = 'ANON1'
    const name = 'Grace Hopper'
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          segment_library: segmentLibraryValue
        },
        context: {
          traits: {
            name
          }
        },
        anonymousId: anonymous_id
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(addUserPropertiesSpy).toHaveBeenCalledWith({
      anonymous_id,
      name
    })
    expect(identifySpy).toHaveBeenCalledTimes(0)
  })
})
