import { Analytics, Context } from '@segment/analytics-next'
import fullSessionDestination from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

// Mock the browser destination runtime functions
jest.mock('@segment/browser-destination-runtime/load-script', () => ({
  loadScript: (_src: any, _attributes: any) => Promise.resolve()
}))

jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
  resolveWhen: (_fn: any, _timeout: any) => Promise.resolve()
}))

// Mock the fullsession package
jest.mock('fullsession', () => ({
  fullSessionTracker: {
    initialize: jest.fn(),
    identify: jest.fn(),
    setSessionAttributes: jest.fn(),
    event: jest.fn()
  }
}))

const trackSubscription: Subscription = {
  partnerAction: 'recordEvent',
  name: 'Record Event',
  enabled: true,
  subscribe: 'type = "track"',
  mapping: {
    name: {
      '@path': '$.event'
    },
    properties: {
      '@path': '$.properties'
    }
  }
}

describe('FullSession recordEvent action', () => {
  const mockCustomerId = 'test-customer-id'

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup window.FUS mock if needed
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.FUS = {}
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should record event with name and properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Product Purchased'
    const properties = {
      product_id: 'ABC123',
      product_name: 'Widget',
      price: 29.99,
      currency: 'USD',
      category: 'Electronics'
    }

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName,
        properties
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, properties)
  })

  test('should record event with only name', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Simple Event'

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, {})
  })

  test('should record event with string and number properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Page View'
    const properties = {
      page_url: 'https://example.com/product/123',
      page_title: 'Product Details',
      load_time: 1.5,
      session_id: 'sess_123',
      user_count: 42
    }

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName,
        properties
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, properties)
  })

  test('should handle empty properties object', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Button Clicked'

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName,
        properties: {}
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, {})
  })

  test('should handle null properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Null Properties Event'

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName,
        properties: undefined
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, {})
  })

  test('should record multiple events in sequence', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    // First event
    await event.track?.(
      new Context({
        type: 'track',
        event: 'Event 1',
        properties: { prop1: 'value1' }
      })
    )

    // Second event
    await event.track?.(
      new Context({
        type: 'track',
        event: 'Event 2',
        properties: { prop2: 'value2', count: 10 }
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledTimes(2)
    expect(fullSessionTracker.event).toHaveBeenNthCalledWith(1, 'Event 1', { prop1: 'value1' })
    expect(fullSessionTracker.event).toHaveBeenNthCalledWith(2, 'Event 2', { prop2: 'value2', count: 10 })
  })

  test('should record event with mixed property types', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Mixed Properties Event'
    const properties = {
      string_prop: 'test string',
      number_prop: 123.45,
      boolean_prop: true,
      array_prop: [1, 2, 3],
      object_prop: { nested: 'value' },
      null_prop: null,
      undefined_prop: undefined
    }

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName,
        properties
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, properties)
  })

  test('should handle event with special characters in name', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [trackSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const eventName = 'Event with Special Characters! @#$%^&*()'
    const properties = {
      special_chars: 'åäöüñ',
      unicode: '🎉🚀'
    }

    await event.track?.(
      new Context({
        type: 'track',
        event: eventName,
        properties
      })
    )

    expect(fullSessionTracker.event).toHaveBeenCalledWith(eventName, properties)
  })
})
