import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../../launchdarkly-audiences/syncAudience/custom-audience-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Engage Audiences to LaunchDarkly segments',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    custom_audience_name: {
      label: 'Custom Audience Name',
      description: 'Name of custom audience list to which user identifier should added/removed',
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
    context_kind: {
      label: 'Context kind',
      description: 'LaunchDarkly context kind',
      type: 'string',
      required: true,
      default: 'user',
      choices: [{ label: 'User', value: 'user' }]
    },
    context_key: {
      label: 'Context key',
      description: 'LaunchDarkly context key',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.email' }
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
    }
  },

  perform: (request, { payload, settings }) => {
    return processPayload(request, settings, [payload])
  },

  performBatch: (request, { payload, settings }) => {
    return processPayload(request, settings, payload)
  }
}

export default action
