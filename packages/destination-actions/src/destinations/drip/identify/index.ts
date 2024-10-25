import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseUrl, headers } from '../utils'

const person: (payload: Payload) => any = (payload) => {
  return {
    email: payload.email,
    ip_address: payload.ip,
    sms_number: payload.sms,
    time_zone: payload.timezone,
    status: payload.status,
    status_updated_at: payload.status_updated_at,
    tags: payload.tags,
    custom_fields: payload.customFields
    // prospect: true // omit for now, lead scoring is not promoted by our product
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify person in Drip',
  fields: {
    email: {
      // Can we omit new_email?
      description: "The person's email address.",
      label: 'Email Address',
      required: true,
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    ip: {
      description: "The person's ip address.",
      label: 'IP Address',
      required: false,
      type: 'string',
      format: 'ipv4',
      default: { '@path': '$.context.ip' }
    },
    sms: {
      description: "The person's sms number.",
      label: 'SMS Number',
      required: false,
      type: 'string',
      default: { '@path': '$.traits.sms' }
    },
    timezone: {
      description: "The person's timezone.",
      label: 'Timezone',
      required: false,
      type: 'string',
      default: { '@path': '$.context.timezone' }
    },
    status: {
      description: "The person's status.",
      label: 'Status',
      required: false,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.status' },
          then: { '@path': '$.traits.status' },
          else: 'unsubscribed'
        }
      }
    },
    status_updated_at: {
      description: "The timestamp associated with the update to a person's status.",
      label: 'Status Updated At',
      required: false,
      type: 'datetime',
      default: { '@path': '$.traits.status_updated_at' }
    },
    tags: {
      // Can we omit remove_tags?
      description: "Tags to add to a person's profile.",
      label: 'Tags',
      required: false,
      type: 'object', // array of strings
      default: { '@path': '$.properties.tags' }
    },
    customFields: {
      description: "Custom fields to add to a person's profile.",
      label: 'Custom fields',
      required: false,
      type: 'object', // dictionary of strings to strings
      default: { '@path': '$.properties.customFields' }
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`${baseUrl}/v2/3977335/subscribers`, {
      method: 'POST',
      headers: headers(settings),
      json: person(payload)
    })
  },
  performBatch: (request, { settings, payload }) => {
    return request(`${baseUrl}/v2/3977335/subscribers/batches`, {
      method: 'POST',
      headers: headers(settings),
      json: { subscribers: payload.map(person) }
    })
  }
}

export default action
