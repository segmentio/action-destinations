import { Subscription } from '@segment/browser-destination-runtime/types'

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

export const REPLAYBIRD_SITE_KEY = 'secret'
export const subscriptions = [trackSubscription, identifySubscription]
