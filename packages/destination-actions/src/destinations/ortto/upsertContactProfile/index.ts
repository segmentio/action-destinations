import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
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
    audience_id: {
      label: 'Audience',
      description: `The Audience to add the contact profile to.`,
      type: 'string',
      dynamic: true
    }
  },
  dynamicFields: {
    audience_id: async (request, { settings }): Promise<DynamicFieldResponse> => {
      const client: OrttoClient = new OrttoClient(request)
      return await client.listAudiences(settings)
    }
  },
  perform: async (request, { settings, payload }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.upsertContacts(settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.upsertContacts(settings, payload)
  }
}

export default action
