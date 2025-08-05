import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayloads } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to User Group',
  description:
    'Sync Segment user data to a user group in LiveLike. Can be used to sync Engage Audience data to LiveLike User Groups.',
  defaultSubscription: 'type = "identify"',
  fields: {
    audience_id: {
      label: 'Segment Audience ID',
      type: 'string',
      required: true,
      description: 'The unique identifier for the Segment Audience.',
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    audience_name: {
      label: 'Segment Audience Name',
      type: 'string',
      required: true,
      description: 'The name of the Segment Audience.',
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    action: {
      label: 'Action',
      type: 'boolean',
      description:
        'Set to true to add the user to the User Group, set to false to remove the user from the User Group. If connecting to an Engage Audience, leave this field empty.'
    },
    timestamp: {
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp of the event.',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    additional_user_traits: {
      label: 'Additional user traits',
      description: 'Used for trait values to send to Livelike.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: true,
      properties: {
        livelike_profile_id: {
          label: 'LiveLike User Profile ID',
          type: 'string',
          description: 'The unique LiveLike user identifier.'
        },
        email: {
          label: 'Email',
          type: 'string',
          description: 'The email address of the user.'
        }
      },
      default: {
        livelike_profile_id: {
          '@if': {
            exists: { '@path': '$.traits.livelike_profile_id' },
            then: { '@path': '$.traits.livelike_profile_id' },
            else: { '@path': '$.properties.livelike_profile_id' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      }
    },
    traits_or_properties_hidden: {
      label: 'Traits or Properties hidden',
      description: 'Hidden field used to figure out if user is added or removed from an Engage Audience',
      type: 'object',
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'A unique identifier for a user.',
      default: {
        '@path': '$.userId'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      type: 'boolean',
      description: 'Enable batching for this action. If enabled, the action will process records in batches.',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      type: 'number',
      description: 'The number of records to process in each batch. Default is 100.',
      default: 100,
      minimum: 1,
      maximum: 500
    }
  },
  perform: (request, { settings, payload }) => {
    return processPayloads(request, [payload], settings)
  },
  performBatch: (request, { settings, payload }) => {
    return processPayloads(request, payload, settings)
  }
}

export default action
