import type { ActionDefinition, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import OrttoClient from '../ortto-client'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Contact',
  description: 'Update contact profile',
  defaultSubscription: 'type = "identify"',
  fields: {
    timestamp: commonFields.timestamp,
    message_id: commonFields.message_id,
    user_id: commonFields.user_id,
    anonymous_id: commonFields.anonymous_id,
    enable_batching: commonFields.enable_batching,
    ip: commonFields.ipV4,
    location: commonFields.location,
    traits: commonFields.traits,
    audience_update_mode: commonFields.audience_update_mode,
    batch_size: commonFields.batch_size // Hidden
  },
  hooks: {
    retlOnMappingSave: {
      label: 'Choose an existing audience or create a new one in Ortto',
      description:
        'When you save this mapping, Segment will either create a new audience in Ortto or link to an existing one. Since audience names are unique per Segment data source, Ortto will return the existing audience if one with the specified name already exists.',
      inputFields: {
        audience_name: {
          type: 'string',
          label: 'The name of the Audience to create/link',
          description: 'Enter the name of the audience in Ortto. Audience names are unique per Segment data source'
        }
      },
      outputTypes: {
        audience_id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the Ortto audience to which contacts will be synced.',
          required: false
        },
        audience_name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the Ortto audience to which contacts will be synced.',
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
      (hookOutputs?.retlOnMappingSave?.outputs?.audience_id as string) ?? ''
    )
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    console.log('BATCH', hookOutputs?.retlOnMappingSave?.outputs?.id)
    const client: OrttoClient = new OrttoClient(request)
    return await client.upsertContacts(
      settings,
      payload,
      (hookOutputs?.retlOnMappingSave?.outputs?.audience_id as string) ?? ''
    )
  }
}

export default action
