import { HeapApi } from './types'
import { Subscription } from '@segment/browser-destination-runtime/types'
import nock from 'nock'

export const HEAP_TEST_ENV_ID = '1'

export const createMockedHeapJsSdk = (): HeapApi => {
  return {
    appid: HEAP_TEST_ENV_ID,
    config: {
      disableTextCapture: true,
      secureCookie: true
    },
    load: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    addUserProperties: jest.fn()
  }
}
export const trackEventSubscription: Subscription = {
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

export const identifyUserSubscription: Subscription = {
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

export const mockHeapJsHttpRequest = (): void => {
  nock('https://cdn.heapanalytics.com').get(`/js/heap-${HEAP_TEST_ENV_ID}.js`).reply(200, {})
}
