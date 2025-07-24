import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { apiBaseUrl } from '../properties'
import { UserGroupJSON } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to User Group',
  description: 'Sync Segment user data to a user group in LiveLike. Can be used to sync Engage Audience data to LiveLike User Groups.',
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
      description: 'Set to true to add the user to the User Group, set to false to remove the user from the User Group. If connecting to an Engage Audience, leave this field empty.'
    },
    timestamp: {
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp of the event.',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    traits_or_properties: {
      label: 'Traits or Properties',
      description: 'Hidden fields used to figure out if user is added or removed from an Engage Audience',
      type: 'object',
      unsafe_hidden: true,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      required: true,
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
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'A unique identifier for a user.',
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const url = `${apiBaseUrl}/applications/${settings.clientId}/segment-audience-sync/`
    const { audience_id, audience_name, action, timestamp, user_id, traits_or_properties: { livelike_profile_id } = {}, traits_or_properties } = payload;
    const actionValue = typeof action === 'boolean' ? action : traits_or_properties?.[audience_name]
    delete traits_or_properties[audience_name]
    if(livelike_profile_id){
      delete traits_or_properties[livelike_profile_id]
    }
    if(typeof actionValue !== 'boolean') {
      throw new PayloadValidationError('Action must be a boolean value (true for add, false for remove). If connecting to an Engage Audience, leave this field empty and ensure the audience_id and audience_name field mappings are left to their default values.')
    }

    const json: UserGroupJSON = {
      audience_id,
      audience_name,
      action: actionValue,
      timestamp,
      livelike_profile_id,
      user_id,
      traits_or_properties
    }

    return request(url, {
      method: 'post',
      json
    })
  }
}

export default action
