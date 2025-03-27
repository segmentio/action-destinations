import type { HeapApi } from './types'

export const HEAP_TEST_ENV_ID = '1'

export const createMockedHeapJsSdk = (): HeapApi => {
  return {
    appid: HEAP_TEST_ENV_ID,
    envId: HEAP_TEST_ENV_ID,
    config: {
      disableTextCapture: true,
      secureCookie: true
    },
    load: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    addUserProperties: jest.fn(),
    init: jest.fn(),
    startTracking: jest.fn(),
    stopTracking: jest.fn(),
    resetIdentity: jest.fn(),
    identifyHashed: jest.fn(),
    getSessionId: jest.fn(),
    getUserId: jest.fn(),
    getIdentity: jest.fn(),
    addEventProperties: jest.fn(),
    removeEventProperty: jest.fn(),
    clearEventProperties: jest.fn(),
    addAccountProperties: jest.fn(),
    addAdapter: jest.fn(),
    addTransformer: jest.fn(),
    addTransformerFn: jest.fn(),
    onReady: jest.fn(),
    addPageviewProperties: jest.fn(),
    removePageviewProperty: jest.fn(),
    clearPageviewProperties: jest.fn(),
    trackPageview: jest.fn()
  }
}

export const trackEventSubscription = {
  partnerAction: 'trackEvent',
  name: 'Track Event',
  enabled: true,
  subscribe: 'type = "track"',
  mapping: {
    name: {
      '@path': '$.name'
    },
    properties: {
      '@path': '$.properties'
    },
    identity: {
      '@path': '$.userId'
    },
    anonymousId: {
      '@path': '$.anonymousId'
    },
    traits: {
      '@path': '$.context.traits'
    }
  }
}

export const identifyUserSubscription = {
  partnerAction: 'identifyUser',
  name: 'Identify User',
  enabled: true,
  subscribe: 'type = "identify"',
  mapping: {
    anonymousId: {
      '@path': '$.anonymousId'
    },
    userId: {
      '@path': '$.userId'
    },
    traits: {
      '@path': '$.traits'
    }
  }
}
