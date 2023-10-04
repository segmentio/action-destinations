import { UserMotion } from './types'
import { Subscription } from '@segment/browser-destination-runtime/types'
import nock from 'nock'

export const TEST_API_KEY = '0000000000000001'

export const mockedSdk = (): UserMotion => {
  return {
    track: jest.fn(),
    identify: jest.fn(),
    pageview: jest.fn(),
    group: jest.fn()
  }
}
export const identifySubscription: Subscription = {
  partnerAction: 'identify',
  name: 'Identify User',
  enabled: true,
  subscribe: 'type = "identify"',
  mapping: {
    userId: { '@path': '$.userId' },
    traits: { '@path': '$.traits' }
  }
}

export const trackSubscription: Subscription = {
  partnerAction: 'track',
  name: 'Track Event',
  enabled: true,
  subscribe: 'type = "track"',
  mapping: {
    event: {
      '@path': '$.name'
    },
    properties: {
      '@path': '$.properties'
    }
  }
}

export const mockJsHttpRequest = (): void => {
  nock('https://api.usermotion.com').get(`/js/${TEST_API_KEY}.js`).reply(200, {})
}
