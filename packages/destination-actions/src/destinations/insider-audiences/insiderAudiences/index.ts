import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Insider Audiences',
  description: 'Sync Audiences and Computed Traits from Segment to Insider InOne',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    custom_audience_name: {
      label: 'Custom Audience Name',
      description: 'Name of custom audience list to which emails should added/removed',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description: "Segment computation class used to determine if action is an 'Engage-Audience'",
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      }
    },
    email: {
      label: 'Email',
      description: "User's email address for including/excluding from custom audience",
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: "User's phone number for including/excluding from custom audience",
      type: 'string',
      format: 'text',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.traits.phone' }
        }
      }
    },
    traits_or_props: {
      label: 'traits or properties object',
      description: 'Object which will be computed differently for track and identify events',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    user_id: {
      label: 'User ID',
      description: 'Known user identifier for the user',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Anonymous user identifier for the user',
      type: 'string',
      required: false,
      default: {
        '@path': '$.anonymousId'
      }
    },
    event_type: {
      label: 'Event Type',
      description: 'Type of event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    event_name: {
      label: 'Event Name',
      description: 'Name of event',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp of event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload }) => {
    return processPayload(request, [payload])
  }
}

export default action
