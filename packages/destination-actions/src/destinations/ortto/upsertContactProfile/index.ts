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
    ip: {
      label: 'IP Address',
      description: "The contact's IP address",
      placeholder: '180.1.12.125',
      type: 'string',
      format: 'ipv4',
      default: { '@path': '$.context.ip' },
      allowNull: true
    },
    location: {
      label: 'Location',
      description: "The contact's location. Will take priority over the IP address.",
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: false,
      allowNull: true,
      properties: {
        country: {
          label: 'Country',
          type: 'string',
          allowNull: true
        },
        state: {
          label: 'State',
          type: 'string',
          allowNull: true
        },
        city: {
          label: 'City',
          type: 'string',
          allowNull: true
        },
        post_code: {
          label: 'Postcode',
          type: 'string',
          allowNull: true
        }
      },
      default: {
        country: { '@path': '$.context.location.country' },
        city: { '@path': '$.context.location.city' }
      }
    },
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
    },
    audience_id: commonFields.audience_id
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
