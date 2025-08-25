import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import fullSessionDestination, { destination } from '../index'

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

// Setup a more complete mock environment
const mockWorkerAndXMLHttpRequest = () => {
  // @ts-ignore
  global.Worker = class Worker {
    constructor(stringUrl: string) {
      // @ts-ignore
      this.url = stringUrl
      // @ts-ignore
      this.onmessage = () => {}
    }

    postMessage() {
      return {}
    }
  }

  // @ts-ignore
  global.XMLHttpRequest = class XMLHttpRequest {
    open() {
      return {}
    }
    send() {
      return {}
    }
    setRequestHeader() {
      return {}
    }
  }
}

const subscriptions: Subscription[] = [
  {
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
  },
  {
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
]

describe('FullSession (actions)', () => {
  const mockCustomerId = 'test-customer-id'

  beforeAll(() => {
    mockWorkerAndXMLHttpRequest()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup window.FUS mock if needed
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.FUS = {}
    }
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  test('loads FullSession with customerId', async () => {
    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: subscriptions as any
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
  }, 10000) // Increase timeout to 10 seconds

  test('initializes FullSession tracker with correct customer ID', async () => {
    const { fullSessionTracker } = await import('fullsession')

    const [event] = await fullSessionDestination({
      customerId: mockCustomerId,
      subscriptions: subscriptions as any
    })

    await event.load(Context.system(), {} as Analytics)
    expect(fullSessionTracker.initialize).toHaveBeenCalledWith(mockCustomerId)
  }, 10000) // Increase timeout to 10 seconds

  test('has correct presets configured', () => {
    expect(destination.presets).toHaveLength(3)

    const identifyPreset = destination.presets?.find((p) => p.name === 'Identify User')
    expect(identifyPreset).toBeDefined()
    expect(identifyPreset?.partnerAction).toBe('identifyUser')

    const trackPreset = destination.presets?.find((p) => p.name === 'Record Event')
    expect(trackPreset).toBeDefined()
    expect(trackPreset?.partnerAction).toBe('recordEvent')

    const pagePreset = destination.presets?.find((p) => p.name === 'Visit Page')
    expect(pagePreset).toBeDefined()
    expect(pagePreset?.partnerAction).toBe('visitPage')
  })

  test('has required settings defined', () => {
    expect(destination.settings).toBeDefined()
    expect(destination.settings?.customerId).toBeDefined()
    expect(destination.settings?.customerId.required).toBe(true)
    expect(destination.settings?.customerId.type).toBe('string')
  })

  test('has correct actions defined', () => {
    expect(destination.actions.identifyUser).toBeDefined()
    expect(destination.actions.recordEvent).toBeDefined()
  })

  test('destination mode is device', () => {
    expect(destination.mode).toBe('device')
  })

  test('destination name is FullSession', () => {
    expect(destination.name).toBe('FullSession')
  })

  test('destination slug is actions-fullsession', () => {
    expect(destination.slug).toBe('actions-fullsession')
  })
})
