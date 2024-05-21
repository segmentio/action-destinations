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
          products: [
            {
              name: 'Test Product 1',
              color: 'red',
              qty: 2,
              custom_vars: {
                position: 0,
                something_else: 'test',
                another_one: ['one', 'two', 'three']
              }
            },
            {
              name: 'Test Product 2',
              color: 'blue',
              qty: 1,
              custom_vars: {
                position: 1,
                something_else: 'blah',
                another_one: ['four', 'five', 'six']
              }
            }
          ]
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledTimes(3)
    expect(heapTrackSpy).toHaveBeenNthCalledWith(1, 'hello! products item', {
      name: 'Test Product 1',
      color: 'red',
      qty: '2',
      'custom_vars.position': '0',
      'custom_vars.something_else': 'test',
      'custom_vars.another_one': '["one","two","three"]',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(heapTrackSpy).toHaveBeenNthCalledWith(2, 'hello! products item', {
      name: 'Test Product 2',
      color: 'blue',
      qty: '1',
      'custom_vars.position': '1',
      'custom_vars.something_else': 'blah',
      'custom_vars.another_one': '["four","five","six"]',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
    expect(heapTrackSpy).toHaveBeenNthCalledWith(3, 'hello!', {
      products:
        '[{"name":"Test Product 1","color":"red","qty":2,"custom_vars":{"position":0,"something_else":"test","another_one":["one","two","three"]}},{"name":"Test Product 2","color":"blue","qty":1,"custom_vars":{"position":1,"something_else":"blah","another_one":["four","five","six"]}}]',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
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
        val: i.toString(),
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
    }
    for (let i = 4; i <= 5; i++) {
      expect(heapTrackSpy).toHaveBeenNthCalledWith(i, 'hello! testArray2 item', {
        val: i.toString(),
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
    }
    expect(heapTrackSpy).toHaveBeenNthCalledWith(6, 'hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME,
      testArray1: '[{"val":1},{"val":2},{"val":3}]',
      testArray2: '[{"val":4},{"val":5},{"val":"N/A"}]'
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
      testArray1: '[{"val":1},{"val":2},{"val":3}]',
      testArray2: '[{"val":4},{"val":5},{"val":"N/A"}]',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
  })

  it('should stringify array', async () => {
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          testArray1: ['test', 'testing', 'tester']
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledTimes(1)

    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      testArray1: '["test","testing","tester"]',
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    })
  })

  it('should flatten properties', async () => {
    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          isAutomated: true,
          isClickable: true,
          custom_vars: {
            bodyText: 'Testing text',
            ctaText: 'Click me',
            position: 0,
            testNestedValues: {
              count: 5,
              color: 'green'
            }
          }
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME,
      isAutomated: 'true',
      isClickable: 'true',
      'custom_vars.bodyText': 'Testing text',
      'custom_vars.ctaText': 'Click me',
      'custom_vars.position': '0',
      'custom_vars.testNestedValues.count': '5',
      'custom_vars.testNestedValues.color': 'green'
    })
  })

  it('should flatten properties on parent when browserArrayLimit is set', async () => {
    await eventWithUnrolling.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          boolean_test: false,
          string_test: 'react',
          number_test: 0,
          custom_vars: {
            property: 1
          }
        }
      })
    )
    expect(heapTrackSpy).toHaveBeenCalledWith('hello!', {
      segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME,
      boolean_test: 'false',
      string_test: 'react',
      number_test: '0',
      'custom_vars.property': '1'
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

  describe('data tests', () => {
    it('should unroll and flatten', async () => {
      await eventWithUnrolling.track?.(
        new Context({
          type: 'track',
          name: 'Product List Viewed',
          properties: {
            membership_status: 'lead',
            products: [
              {
                sku: 'PT2252152-0001-00',
                url: '/products/THE-ONE-JOGGER-PT2252152-0001-2',
                variant: 'Black',
                vip_price: 59.95,
                membership_brand_id: 1,
                quantity: 1
              },
              {
                sku: 'PT2252152-4846-00',
                url: '/products/THE-ONE-JOGGER-PT2252152-4846',
                variant: 'Deep Navy',
                vip_price: 59.95,
                membership_brand_id: 1,
                quantity: 1
              },
              {
                sku: 'PT2458220-0001-00',
                url: '/products/THE-YEAR-ROUND-TERRY-JOGGER-PT2458220-0001',
                variant: 'Black',
                vip_price: 59.95,
                membership_brand_id: 1,
                quantity: 1
              }
            ],
            store_group_id: '16',
            session_id: '14322962105',
            user_status_initial: 'lead',
            utm_campaign: null,
            utm_medium: null,
            utm_source: null,
            customer_id: '864832720'
          }
        })
      )
      expect(heapTrackSpy).toHaveBeenCalledTimes(4)
      expect(heapTrackSpy).toHaveBeenNthCalledWith(1, 'Product List Viewed products item', {
        sku: 'PT2252152-0001-00',
        url: '/products/THE-ONE-JOGGER-PT2252152-0001-2',
        variant: 'Black',
        vip_price: '59.95',
        membership_brand_id: '1',
        quantity: '1',
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
      expect(heapTrackSpy).toHaveBeenNthCalledWith(2, 'Product List Viewed products item', {
        sku: 'PT2252152-4846-00',
        url: '/products/THE-ONE-JOGGER-PT2252152-4846',
        variant: 'Deep Navy',
        vip_price: '59.95',
        membership_brand_id: '1',
        quantity: '1',
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
      expect(heapTrackSpy).toHaveBeenNthCalledWith(3, 'Product List Viewed products item', {
        sku: 'PT2458220-0001-00',
        url: '/products/THE-YEAR-ROUND-TERRY-JOGGER-PT2458220-0001',
        variant: 'Black',
        vip_price: '59.95',
        membership_brand_id: '1',
        quantity: '1',
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
      expect(heapTrackSpy).toHaveBeenNthCalledWith(4, 'Product List Viewed', {
        membership_status: 'lead',
        products:
          '[{"sku":"PT2252152-0001-00","url":"/products/THE-ONE-JOGGER-PT2252152-0001-2","variant":"Black","vip_price":59.95,"membership_brand_id":1,"quantity":1},{"sku":"PT2252152-4846-00","url":"/products/THE-ONE-JOGGER-PT2252152-4846","variant":"Deep Navy","vip_price":59.95,"membership_brand_id":1,"quantity":1},{"sku":"PT2458220-0001-00","url":"/products/THE-YEAR-ROUND-TERRY-JOGGER-PT2458220-0001","variant":"Black","vip_price":59.95,"membership_brand_id":1,"quantity":1}]',
        store_group_id: '16',
        session_id: '14322962105',
        user_status_initial: 'lead',
        utm_campaign: null,
        utm_medium: null,
        utm_source: null,
        customer_id: '864832720',
        segment_library: HEAP_SEGMENT_BROWSER_LIBRARY_NAME
      })
    })
  })
})
