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
    event: {
      label: 'Event name',
      description: 'Event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Activity properties',
      description: 'An object containing key-value pairs representing activity attributes',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    },
    ip: {
      label: 'IP Address',
      description: 'The IP address of the location where the activity occurred.',
      placeholder: '180.1.12.125',
      type: 'string',
      format: 'ipv4',
      default: { '@path': '$.context.ip' },
      allowNull: true
    },
    location: {
      label: 'Location',
      description: 'The location where the activity occurred. Will take priority over the IP address.',
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
        phone: { '@path': '$.context.traits.phone' },
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
