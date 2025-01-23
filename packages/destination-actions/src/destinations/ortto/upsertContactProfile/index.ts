import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import OrttoClient from '../ortto-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Contact',
  description: 'Update contact profile',
  defaultSubscription: 'type = "identify"',
  fields: {
    timestamp: {
      label: 'Timestamp',
      description: 'Event timestamp',
      type: 'string',
      readOnly: true,
      unsafe_hidden: true,
      format: 'date-time',
      default: {
        '@path': '$.timestamp'
      }
    },
    message_id: {
      label: 'Message ID',
      description: 'Message ID',
      type: 'string',
      readOnly: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.messageId'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'When enabled, events will be sent to Ortto in batches for improved efficiency.',
      default: true
    },
    user_id: {
      label: 'User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Anonymous user identifier',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    geo_mode: {
      label: 'Geolocation mode',
      description: "Specifies how to assign the contact's location",
      default: 'none',
      type: 'string',
      choices: [
        { label: 'IP Address', value: 'ip' },
        { label: 'Location', value: 'location' },
        { label: 'None', value: 'none' }
      ]
    },
    ip: {
      label: 'IP Address',
      description: "The contact's IP address",
      placeholder: '180.1.12.125',
      type: 'string',
      format: 'ipv4',
      default: { '@path': '$.context.ip' },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'geo_mode',
            operator: 'is',
            value: 'ip'
          }
        ]
      }
    },
    location: {
      label: 'Location',
      description: "The contact's location",
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: false,
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
        country: { '@path': '$.traits.address.country' },
        state: { '@path': '$.traits.address.state' },
        city: { '@path': '$.traits.address.city' },
        post_code: { '@path': '$.traits.address.postal_code' }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'geo_mode',
            operator: 'is',
            value: 'location'
          }
        ]
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
