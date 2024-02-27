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
  let eventWithUnrolling: Plugin
  let event: Plugin
  let heapTrackSpy: jest.SpyInstance
  let addUserPropertiesSpy: jest.SpyInstance
  let identifySpy: jest.SpyInstance

  beforeAll(async () => {
    mockHeapJsHttpRequest()
    window.heap = createMockedHeapJsSdk()

    eventWithUnrolling = (
      await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [trackEventSubscription], browserArrayLimit: 5 })
    )[0]
    await eventWithUnrolling.load(Context.system(), {} as Analytics)

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
    await eventWithUnrolling.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          banana: '📞',
          apple: [
            {
              carrot: 12,
              broccoli: [
                {
                  onion: 'crisp',
                  tomato: 'fruit'
                }
              ]
            },
            {
              carrot: 21,
              broccoli: [
                {
                  tomato: 'vegetable'
                },
                {
                  tomato: 'fruit'
                },
                [
                  {
                    pickle: 'vinegar'
                  },
                  {
                    pie: 3.1415
                  }
                ]
              ]
            }
          ],
          emptyArray: [],
          float: 1.2345,
          booleanTrue: true,
          booleanFalse: false,
          nullValue: null,
          undefinedValue: undefined
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledTimes(3)
    expect(heapTrackSpy).toHaveBeenNthCalledWith(1, 'hello! apple item', {
      carrot: 12,
      'broccoli.0.onion': 'crisp',
      'broccoli.0.tomato': 'fruit',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(heapTrackSpy).toHaveBeenNthCalledWith(2, 'hello! apple item', {
      carrot: 21,
      'broccoli.0.tomato': 'vegetable',
      'broccoli.1.tomato': 'fruit',
      'broccoli.2.0.pickle': 'vinegar',
      'broccoli.2.1.pie': '3.1415',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(heapTrackSpy).toHaveBeenNthCalledWith(3, 'hello!', {
      banana: '📞',
      float: 1.2345,
      booleanTrue: true,
      booleanFalse: false,
      nullValue: null,
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME,
      'apple.0.broccoli.0.onion': 'crisp',
      'apple.0.broccoli.0.tomato': 'fruit',
      'apple.0.carrot': '12',
      'apple.1.broccoli.0.tomato': 'vegetable',
      'apple.1.broccoli.1.tomato': 'fruit',
      'apple.1.broccoli.2.0.pickle': 'vinegar',
      'apple.1.broccoli.2.1.pie': '3.1415',
      'apple.1.carrot': '21'
    })
    expect(addUserPropertiesSpy).toHaveBeenCalledTimes(0)
    expect(identifySpy).toHaveBeenCalledTimes(0)
  })

  it('limits number of properties in array', async () => {
    await eventWithUnrolling.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          testArray1: [{ val: 1 }, { val: 2 }, { val: 3 }],
          testArray2: [{ val: 4 }, { val: 5 }, { val: 'N/A' }]
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledTimes(6)

    for (let i = 1; i <= 3; i++) {
      expect(heapTrackSpy).toHaveBeenNthCalledWith(i, 'hello! testArray1 item', {
        val: i,
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
    }
    for (let i = 4; i <= 5; i++) {
      expect(heapTrackSpy).toHaveBeenNthCalledWith(i, 'hello! testArray2 item', {
        val: i,
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
    }
    expect(heapTrackSpy).toHaveBeenNthCalledWith(6, 'hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME,
      'testArray1.0.val': '1',
      'testArray1.1.val': '2',
      'testArray1.2.val': '3',
      'testArray2.0.val': '4',
      'testArray2.1.val': '5',
      'testArray2.2.val': 'N/A'
    })
  })

  it('does not limit number of properties if browserArrayLimit is 0', async () => {
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          testArray1: [{ val: 1 }, { val: 2 }, { val: 3 }],
          testArray2: [{ val: 4 }, { val: 5 }, { val: 'N/A' }]
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledTimes(1)

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      testArray1: [{ val: 1 }, { val: 2 }, { val: 3 }],
      testArray2: [{ val: 4 }, { val: 5 }, { val: 'N/A' }],
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
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
