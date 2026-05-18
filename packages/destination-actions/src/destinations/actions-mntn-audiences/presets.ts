import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const presets: DestinationDefinition<Settings>['presets'] = [
  {
    name: 'Add to Audience',
    subscribe: 'event = "Audience Entered"',
    partnerAction: 'addToAudience',
    mapping: {
      segment_id: { '@path': '$.context.personas.external_audience_id' },
      identity_id: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      },
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      },
      phone: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      },
      ip: { '@path': '$.context.ip' },
      maid: {
        '@if': {
          exists: { '@path': '$.context.device.advertisingId' },
          then: { '@path': '$.context.device.advertisingId' },
          else: { '@path': '$.context.device.id' }
        }
      },
      timestamp: { '@path': '$.timestamp' }
    },
    type: 'automatic'
  },
  {
    name: 'Remove from Audience',
    subscribe: 'event = "Audience Exited"',
    partnerAction: 'removeFromAudience',
    mapping: {
      segment_id: { '@path': '$.context.personas.external_audience_id' },
      identity_id: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    type: 'automatic'
  }
]

export { presets }
