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

const pageSubscription: Subscription = {
  partnerAction: 'visitPage',
  name: 'Visit Page',
  enabled: true,
  subscribe: 'type = "page"',
  mapping: {
    name: {
      '@if': {
        exists: { '@path': '$.category' },
        then: { '@path': '$.category' },
        else: { '@path': '$.name' }
      }
    },
    properties: {
      '@path': '$.properties'
    }
  }
}

describe('FullSession visitPage action', () => {
  const mockCustomerId = 'test-customer-id'

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup window.FUS mock if needed
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.FUS = {}
    }
  })

  test('should set session attributes with page name and properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'Home Page'
    const properties = {
      title: 'Welcome to Our Site',
      url: 'https://example.com',
      path: '/',
      referrer: 'https://google.com',
      search: '?utm_source=google'
    }

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        properties
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: pageName,
      ...properties
    })
  })

  test('should use category as name when present', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'Product Details'
    const category = 'Products'
    const properties = {
      title: 'Amazing Product',
      url: 'https://example.com/products/amazing-product',
      product_id: 'prod_123'
    }

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        category: category,
        properties
      })
    )

    // Should use category as name when present
    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: category,
      ...properties
    })
  })

  test('should use page name when category is not present', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'About Us'
    const properties = {
      title: 'About Our Company',
      url: 'https://example.com/about',
      section: 'company'
    }

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        properties
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: pageName,
      ...properties
    })
  })

  test('should handle page with empty properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'Simple Page'

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        properties: {}
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: pageName
    })
  })

  test('should handle page with null properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'Null Properties Page'

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        properties: undefined
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: pageName
    })
  })

  test('should handle page without name and category', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const properties = {
      title: 'Unnamed Page',
      url: 'https://example.com/unnamed',
      path: '/unnamed'
    }

    await event.page?.(
      new Context({
        type: 'page',
        properties
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: undefined,
      ...properties
    })
  })

  test('should handle complex properties with various data types', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'Complex Page'
    const properties = {
      title: 'Complex Page Title',
      url: 'https://example.com/complex',
      load_time: 2.5,
      user_agent: 'Mozilla/5.0...',
      is_authenticated: true,
      visitor_count: 1500,
      tags: ['homepage', 'featured'],
      metadata: {
        experiment_id: 'exp_123',
        variant: 'A'
      }
    }

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        properties
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: pageName,
      ...properties
    })
  })

  test('should track multiple page visits in sequence', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    // First page visit
    await event.page?.(
      new Context({
        type: 'page',
        name: 'Home',
        properties: { url: 'https://example.com' }
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: 'Home',
      url: 'https://example.com'
    })

    // Second page visit
    await event.page?.(
      new Context({
        type: 'page',
        name: 'Products',
        properties: { url: 'https://example.com/products' }
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: 'Products',
      url: 'https://example.com/products'
    })

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledTimes(2)
  })

  test('should handle page visit with special characters in name and properties', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [pageSubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    const pageName = 'Page with "Special" Characters & Symbols'
    const properties = {
      title: 'Title with émojis 🚀 and symbols!',
      url: 'https://example.com/special-chars?q=test&lang=en',
      description: 'A page with special characters: àáâãäåæçèéêë'
    }

    await event.page?.(
      new Context({
        type: 'page',
        name: pageName,
        properties
      })
    )

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      name: pageName,
      ...properties
    })
  })
})
