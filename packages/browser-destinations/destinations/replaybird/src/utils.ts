import { Subscription } from '@segment/browser-destination-runtime/types'
import nock from 'nock'
import { ReplayBird } from './types'

export const trackSubscription: Subscription = {
  partnerAction: 'trackEvent',
  name: 'Track',
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

export const identifySubscription: Subscription = {
  partnerAction: 'identifyUser',
  name: 'Identify',
  enabled: true,
  subscribe: 'type = "identify"',
  mapping: {
    userId: {
      '@path': '$.userId'
    },
    traits: {
      '@path': '$.traits'
    }
  }
}

export const REPLAYBIRD_API_KEY = 'secret'

export const createMockedReplaybirdJsSdk = (): ReplayBird => {
  return {
    apiKey: REPLAYBIRD_API_KEY,
    init: jest.fn(),
    capture: jest.fn(),
    identify: jest.fn()
  }
}

// https://cdn.replaybird.com/agent/latest/replaybird.js
export const mockReplaybirdJsHttpRequest = (): void => {
  nock('https://cdn.replaybird.com').get(`/agent/latest/replaybird.js`).reply(200, {})
}

export const subscriptions = [trackSubscription, identifySubscription]
