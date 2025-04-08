import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import OrttoClient from '../ortto-client'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Leave Audience (Engage)',
  description: 'Remove contacts from an Audience',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    message_id: commonFields.message_id,
    user_id: commonFields.user_id,
    anonymous_id: commonFields.anonymous_id,
    enable_batching: commonFields.enable_batching,
    audience_id: commonFields.audience_id
  },
  perform: async (request, { settings, payload }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.removeContactsFromAudience(settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.removeContactsFromAudience(settings, payload)
  }
}

export default action
