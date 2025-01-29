import type { ActionDefinition } from '@segment/actions-core'
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
    name: {
      label: 'Name',
      description: 'Event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.name'
      }
    },
    geo_mode: {
      label: 'Geolocation mode',
      description: "Specifies how to assign the event's location",
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
      description: "The event's IP address",
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
      description: "The event's location",
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
    properties: {
      label: 'Activity properties',
      description: 'An object containing key-value pairs representing activity attributes',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    },
    traits: {
      label: 'Custom contact traits',
      description:
        'When provided, it contains key-value pairs representing custom properties assigned to the associated contact profile',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      displayMode: 'collapsed',
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
        email: { '@path': '$.context.traits.email' },
        phone: { '@p ath': '$.context.traits.phone' },
        first_name: { '@path': '$.context.traits.first_name' },
        last_name: { '@path': '$.context.traits.last_name' }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.sendActivities(settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.sendActivities(settings, payload)
  }
}

export default action
