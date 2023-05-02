import { Subscription } from '@segment/browser-destination-runtime/types'

export const TEST_PROJECT_ID = '634947ab6e8b1d18374ed00c'

export const subscriptions: Subscription[] = [
  {
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
  },
  {
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
]
