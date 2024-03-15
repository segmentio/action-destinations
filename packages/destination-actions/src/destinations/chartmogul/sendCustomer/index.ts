import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { event_type, message_id, timestamp, sent_at, user_id } from '../common_fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Customer',
  description: 'Send a Customer (company) to ChartMogul CRM',
  defaultSubscription: 'type = "group"',
  fields: {
    type: { ...event_type, default: 'Send Customer' },
    message_id,
    timestamp,
    sent_at,
    user_id: { ...user_id, required: true },
    group_id: {
      label: 'Group Id',
      description: 'Segment Group Id',
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' }
    },
    name: {
      label: 'Name',
      description: "The company's name",
      type: 'string',
      default: { '@path': '$.traits.name' }
    },
    description: {
      label: 'Description',
      description: "The company's name",
      type: 'string',
      default: { '@path': '$.traits.description' }
    },
    email: {
      label: 'Email',
      description: "The company's email",
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    website: {
      label: 'Website',
      description: "The company's website URL",
      type: 'string',
      format: 'uri-reference',
      default: { '@path': '$.traits.website' }
    },
    created_at: {
      label: 'Created at',
      description: 'Date the group’s account was first created',
      type: 'datetime',
      default: { '@path': '$.traits.createdAt' }
    },
    address: {
      label: 'Address',
      type: 'object',
      description: 'The company’s address details',
      properties: {
        street: {
          label: 'Street',
          type: 'string',
          description: 'The company’s street address'
        },
        city: {
          label: 'City',
          type: 'string',
          description: 'The company’s city'
        },
        state: {
          label: 'State',
          type: 'string',
          description: 'The company’s state or region'
        },
        postal_code: {
          label: 'Postal code',
          type: 'string',
          description: 'The company’s zip or postal code'
        },
        country: {
          label: 'Country',
          type: 'string',
          description: 'The company’s country'
        }
      },
      default: {
        street: { '@path': '$.traits.address.street' },
        city: { '@path': '$.traits.address.city' },
        state: { '@path': '$.traits.address.state' },
        postal_code: { '@path': '$.traits.address.postalCode' },
        country: { '@path': '$.traits.address.country' }
      }
    }
  },
  perform: (request, data) => {
    return request(data.settings.chartmogul_webhook_url, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
