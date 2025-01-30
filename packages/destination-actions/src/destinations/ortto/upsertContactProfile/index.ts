import type { ActionDefinition } from '@segment/actions-core'
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
    geo_mode: commonFields.geo_mode,
    ip: commonFields.ip,
    location: commonFields.location,
    traits: {
      label: 'Custom contact traits',
      description: 'An object containing key-value pairs representing custom properties assigned to contact profile',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        email: {
          label: 'Email',
          description: "The contact's email address",
          placeholder: 'john.smith@example.com',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone Number',
          description: "The contact's phone number",
          placeholder: '+61 159011100',
          type: 'string'
        },
        first_name: {
          label: 'First Name',
          description: "The contact's first name",
          placeholder: 'John',
          type: 'string'
        },
        last_name: {
          label: 'Last Name',
          description: "The contact's last name",
          placeholder: 'Smith',
          type: 'string'
        }
      },
      default: {
        email: { '@path': '$.traits.email' },
        phone: { '@path': '$.traits.phone' },
        first_name: { '@path': '$.traits.first_name' },
        last_name: { '@path': '$.traits.last_name' }
      }
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
