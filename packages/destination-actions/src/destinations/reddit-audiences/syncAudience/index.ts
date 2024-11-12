import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to Reddit',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    computation_key: {
      label: 'Audience Computation Key',
      description: "Segment's friendly name for the Audience",
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    external_audience_id: {
      type: 'string',
      label: 'Audience ID',
      description: 'Unique Audience Identifier returned by the createAudience() function call.',
      required: true,
      unsafe_hidden: false,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    email: {
      label: 'Email address',
      description: "The user's email address",
      type: 'string',
      unsafe_hidden: true,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    iosIDFA: {
      label: 'iOS Ad ID',
      description: 'iOS Ad ID',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.ios_idfa' },
          then: { '@path': '$.traits.ios_idfa' },
          else: { '@path': '$.context.traits.ios_idfa' }
        }
      }
    },
    androidIDFA: {
      label: 'Android Ad ID',
      description: 'Android Ad ID',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.android_idfa' },
          then: { '@path': '$.traits.android_idfa' },
          else: { '@path': '$.context.traits.android_idfa' }
        }
      }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
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
      label: 'Batch events',
      description:
        'When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.',
      required: false,
      default: true
    },
    batch_size: {
      type: 'number',
      label: 'Max batch size',
      description: 'The maximum number of events to batch when sending data to Reddit.',
      required: false,
      default: 2500
    }
  },
  perform: async (request, { payload }) => {
    return await send(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return await send(request, payload)
  }
}

export default action
