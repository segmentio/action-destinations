import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {processPayload} from "../../launchdarkly-audiences/syncAudience/custom-audience-operations";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: '',
  defaultSubscription: 'type = "identify" or type = "track"',
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
    enable_batching: {
      type: 'boolean',
      label: 'enable batching to rokt api',
      description: 'Set as true to ensure Segment infrastructure uses batching when possible.',
      default: true
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
    }
  },

  perform: (request, { payload }) => {
    return processPayload(request, [payload])
  },

  performBatch: (request, { payload }) => {
    return processPayload(request, payload)
  }
}

export default action
