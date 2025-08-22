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

const identifySubscription: Subscription = {
  partnerAction: 'identifyUser',
  name: 'Identify User',
  enabled: true,
  subscribe: 'type = "identify"',
  mapping: {
    userId: {
      '@path': '$.userId'
    },
    anonymousId: {
      '@path': '$.anonymousId'
    },
    name: {
      '@path': '$.traits.name'
    },
    email: {
      '@path': '$.traits.email'
    },
    traits: {
      '@path': '$.traits'
    }
  }
}

describe('FullSession identifyUser action', () => {
  const mockCustomerId = 'test-customer-id'

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup window.FUS mock if needed
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.FUS = {}
    }
  })

  test('should identify user with userId and basic traits', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: 'user123',
        traits: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('user123', {
      name: 'John Doe',
      email: 'john@example.com'
    })

    // No additional traits to set as session attributes
    expect(fullSessionTracker.setSessionAttributes).not.toHaveBeenCalled()
  })

  test('should identify user with userId and additional traits', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: 'user123',
        traits: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Corp',
          role: 'Developer',
          age: 30
        }
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('user123', {
      name: 'John Doe',
      email: 'john@example.com'
    })

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      company: 'Test Corp',
      role: 'Developer',
      age: 30
    })
  })

  test('should identify user with anonymousId when userId is not present', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon123',
        traits: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Test Corp'
        }
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('anon123', {
      name: 'Jane Doe',
      email: 'jane@example.com'
    })

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      company: 'Test Corp',
      segmentAnonymousId: 'anon123'
    })
  })

  test('should prefer userId over anonymousId when both are present', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: 'user123',
        anonymousId: 'anon123',
        traits: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Corp'
        }
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('user123', {
      name: 'John Doe',
      email: 'john@example.com'
    })

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      company: 'Test Corp',
      segmentAnonymousId: 'anon123'
    })
  })

  test('should handle empty or missing name and email', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: 'user123',
        traits: {
          company: 'Test Corp'
        }
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('user123', {
      name: '',
      email: ''
    })

    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      company: 'Test Corp'
    })
  })

  test('should not call identify when neither userId nor anonymousId is present', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        traits: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Corp'
        }
      })
    )

    expect(fullSessionTracker.identify).not.toHaveBeenCalled()
    // Should still set session attributes for additional traits
    expect(fullSessionTracker.setSessionAttributes).toHaveBeenCalledWith({
      company: 'Test Corp'
    })
  })

  test('should not call setSessionAttributes when only name and email are present', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: 'user123',
        traits: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('user123', {
      name: 'John Doe',
      email: 'john@example.com'
    })

    expect(fullSessionTracker.setSessionAttributes).not.toHaveBeenCalled()
  })

  test('should handle null or undefined traits', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: [identifySubscription] as any
    })

    await event.load(Context.system(), {} as Analytics)

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: 'user123'
        // traits is undefined
      })
    )

    expect(fullSessionTracker.identify).toHaveBeenCalledWith('user123', {
      name: '',
      email: ''
    })

    expect(fullSessionTracker.setSessionAttributes).not.toHaveBeenCalled()
  })
})
