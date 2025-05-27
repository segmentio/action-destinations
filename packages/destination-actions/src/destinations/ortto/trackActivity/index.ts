import type { ActionDefinition, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import OrttoClient from '../ortto-client'
import { commonFields } from '../common-fields'
const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Activity',
  description: 'Track user activity',
  defaultSubscription: 'type = "track"',
  fields: {
    timestamp: commonFields.timestamp,
    message_id: commonFields.message_id,
    user_id: commonFields.user_id,
    anonymous_id: commonFields.anonymous_id,
    enable_batching: commonFields.enable_batching,
    ip: {
      ...commonFields.ipV4,
      description: 'The IP address of the location where the activity occurred.'
    },
    location: {
      ...commonFields.location,
      description: 'The location where the activity occurred. Takes priority over the IP address.'
    },
    traits: {
      ...commonFields.traits,
      description:
        "key-value custom property pairs to be assigned to the Contact's profile"
    },
    audience_update_mode: commonFields.audience_update_mode,
    batch_size: commonFields.batch_size,
    event: {
      label: 'Event name',
      description: 'Event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    namespace: {
      label: 'Namespace',
      description: 'Event namespace',
      type: 'string',
      readOnly: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.app.namespace'
      }
    },
    properties: {
      label: 'Activity properties',
      description: 'An object containing key-value pairs representing activity attributes',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    }
  },
  hooks: {
    retlOnMappingSave: {
      label: 'Associate Audience',
      description:
        'Link the Contact to an Audience in Ortto. If the Audience does not already exist, it will be created in Ortto.',
      inputFields: {
        audience_name: {
          type: 'string',
          label: 'Audience Name',
          description: 'The name of the Ortto Audience to link the Contact to.'
        }
      },
      outputTypes: {
        audience_id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the Ortto Audience Contacts will be linked to.',
          required: false
        },
        audience_name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the Ortto Audience contacts will be linkted to.',
          required: false
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        if (!hookInputs.audience_name) {
          return {}
        }
        try {
          const client: OrttoClient = new OrttoClient(request)
          const audience = await client.createAudience(settings, hookInputs.audience_name as string)
          return {
            successMessage: `Connected to Audience '${audience.name}' (id: ${audience.id}) successfully.`,
            savedData: {
              audience_id: audience.id,
              audience_name: audience.name
            }
          }
        } catch (err) {
          return {
            error: {
              message: (err as APIError).message ?? 'Unknown Error',
              code: (err as APIError).status?.toString() ?? 'Unknown Error'
            }
          }
        }
      }
    }
  },
  perform: async (request, { settings, payload, hookOutputs }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.sendActivities(
      settings,
      [payload],
      (hookOutputs?.retlOnMappingSave?.outputs?.audience_id as string) ?? ''
    )
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.sendActivities(
      settings,
      payload,
      (hookOutputs?.retlOnMappingSave?.outputs?.audience_id as string) ?? ''
    )
  }
}

export default action
