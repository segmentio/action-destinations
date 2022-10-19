import { Subscription } from '../../../lib/browser-destinations'

export const trackSubscription: Subscription = {
  partnerAction: 'track',
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
  partnerAction: 'identify',
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

export const subscriptions = [trackSubscription, identifySubscription]
