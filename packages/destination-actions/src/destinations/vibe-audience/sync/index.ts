import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { syncAudience } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Vibe Audience.',
  fields: {
    email: {
      type: 'string',
      required: true,
      label: 'Email',
      format: 'email',
      description: "User's email (ex: foo@bar.com)",
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
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
    ip_address: {
      label: 'IP Address',
      type: 'string',
      description: 'The IP address of the user.',
      default: { '@path': '$.context.ip' }
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
    personal_information: {
      label: 'Personal Information',
      description:
        'Additional user profile details to send to Vibe. This information is used to improve the match rate.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        first_name: {
          type: 'string',
          label: 'First Name',
          description: "User's first name"
        },
        last_name: {
          type: 'string',
          label: 'Last Name',
          description: "User's last name"
        },
        phone: {
          type: 'string',
          label: 'Phone number',
          description: "User's phone number"
        }
      },
      default: {
        first_name: {
          '@if': {
            exists: { '@path': '$.traits.first_name' },
            then: { '@path': '$.traits.first_name' },
            else: { '@path': '$.properties.first_name' }
          }
        },
        last_name: {
          '@if': {
            exists: { '@path': '$.traits.last_name' },
            then: { '@path': '$.traits.last_name' },
            else: { '@path': '$.properties.last_name' }
          }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.traits.phone' },
            then: { '@path': '$.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
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
    return await syncAudience(request, [payload], settings)
  },
  performBatch: async (request, { settings, payload }) => {
    return await syncAudience(request, payload, settings)
  }
}

export default action
