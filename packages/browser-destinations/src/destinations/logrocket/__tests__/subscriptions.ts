import { Subscription } from '../../../lib/browser-destinations'

export const subscriptions: Subscription[] = [
  {
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
]
