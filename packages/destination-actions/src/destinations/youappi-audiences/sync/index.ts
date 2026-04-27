import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Vibe Audience.',
  fields: {
    idfa: {
      type: 'string',
      required: true,
      label: 'iOS Advertising ID (IDFA)',
      description: "User's IDFA",
      default: {
        '@if': {
          exists: { '@path': '$.traits.idfa' },
          then: { '@path': '$.traits.idfa' },
          else: { '@path': '$.properties.idfa' }
        }
      }
    },
    gaid: {
      type: 'string',
      required: true,
      label: 'Android Advertising ID (GAID)',
      description: "User's GAID",
      default: {
        '@if': {
          exists: { '@path': '$.traits.gaid' },
          then: { '@path': '$.traits.gaid' },
          else: { '@path': '$.properties.gaid' }
        }
      }
    },
    audience_name: {
      label: 'Audience Name',
      description: 'The name of the audience to which you want to add users.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    audience_id: {
      label: 'Audience ID',
      description: 'The ID of the audience to which you want to add users.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      },
      readOnly: true
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
      label: 'Enable Batching',
      description: 'Enable batching of requests.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true,
      required: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 1000,
      unsafe_hidden: true,
      required: true
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['audience_id', 'audience_name']
    }
  },
  perform: async (request, { settings, payload }) => {
    return await send(request, [payload], settings, false)
  },
  performBatch: async (request, { settings, payload }) => {
    return await send(request, payload, settings, true)
  }
}

export default action
