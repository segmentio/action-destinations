import type { ActionDefinition, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import OrttoClient from '../ortto-client'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a Contact in Ortto',
  defaultSubscription: 'type = "identify"',
  fields: {
    timestamp: {
      label: 'Timestamp',
      description: 'Event timestamp (ISO 8601)',
      type: 'string',
      readOnly: true,
      format: 'date-time',
      required: false,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    message_id: {
      label: 'Message ID',
      description: 'Message ID',
      type: 'string',
      readOnly: true,
      required: false,
      unsafe_hidden: true,
      default: {
        '@path': '$.messageId'
      }
    },
    user_id: commonFields.user_id,
    anonymous_id: commonFields.anonymous_id,
    enable_batching: commonFields.enable_batching,
    ip: commonFields.ipV4,
    location: commonFields.location,
    traits: commonFields.traits,
    audience_update_mode: commonFields.audience_update_mode,
    batch_size: commonFields.batch_size
  },
  hooks: {
    onMappingSave: {
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
    return await client.upsertContacts(
      settings,
      [payload],
      (hookOutputs?.onMappingSave?.outputs?.audience_id as string) ?? ''
    )
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.upsertContacts(
      settings,
      payload,
      (hookOutputs?.onMappingSave?.outputs?.audience_id as string) ?? ''
    )
  }
}

export default action
