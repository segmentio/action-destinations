import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Ortto } from '../options'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Contact',
  description: 'Update contact profile',
  defaultSubscription: 'type = "identify"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'When enabled, events will be sent to Ortto in batches for improved efficiency.',
      default: false
    },
    create_if_not_found: {
      type: 'boolean',
      label: 'Create if not found',
      default: true,
      description: 'Creates a new contact profile if one does not already exist.'
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
    email: {
      label: 'Email',
      description: "The contact's email address",
      placeholder: 'john.smith@example.com',
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    phone: {
      label: 'Phone Number',
      description: "The contact's phone number",
      placeholder: '+61 159011100',
      type: 'string',
      format: 'text',
      default: { '@path': '$.traits.phone' }
    },
    first_name: {
      label: 'First Name',
      description: "The contact's first name",
      placeholder: 'John',
      type: 'string',
      default: { '@path': '$.traits.firstName' }
    },
    last_name: {
      label: 'Last Name',
      description: "The contact's last name",
      placeholder: 'Smith',
      type: 'string',
      default: { '@path': '$.traits.lastName' }
    },
    geo_mode: {
      label: 'Geolocation mode',
      description: "Specifies how to assign the contact's location",
      default: 'none',
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
        post_code: { '@path': '$.traits.address.postalCode' }
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
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, data) => {
    return request(`${Ortto.BASE_URL}`, {
      method: 'post',
      json: data.payload
    })
  },
  performBatch: (request, data) => {
    return request(`${Ortto.BASE_URL}`, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
