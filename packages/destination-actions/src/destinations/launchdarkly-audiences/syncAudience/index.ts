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
      label: 'Audience Key',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description: "Segment computation class used to determine if action is an 'Engage-Audience'",
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      }
    },
    context_kind: {
      label: 'Context kind',
      description:
        "The event's context kind. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).",
      type: 'string',
      required: true,
      default: 'user'
    },
    context_key: {
      label: 'Context key',
      description: 'The unique LaunchDarkly context key. In most cases the Segment `userId` should be used.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
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
