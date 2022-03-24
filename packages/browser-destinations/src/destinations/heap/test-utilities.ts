import { HeapApi } from './types'
import { Subscription } from '../../lib/browser-destinations'
import nock from 'nock'

export const HEAP_TEST_ENV_ID = '1'

export const createMocekdHeapJsSdk = (): HeapApi => {
  return {
    appid: HEAP_TEST_ENV_ID,
    config: {
      disableTextCapture: true,
      secureCookie: true
    },
    load: jest.fn(),
    track: jest.fn(),
    identify: jest.fn()
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
    email: {
      '@path': '$.traits.email'
    },
    traits: {
      '@path': '$.traits'
    },
    displayName: {
      '@path': '$.traits.name'
    }
  }
}

export const mockHeapJsHttpRequest = (): void => {
  nock('https://cdn.heapanalytics.com').get(`/js/heap-${HEAP_TEST_ENV_ID}.js`).reply(200, {})
}
