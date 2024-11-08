import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const person = (payload: Payload) => {
  return {
    custom_fields: payload.custom_fields,
    email: payload.email,
    ip_address: payload.ip,
    sms_number: payload.phone,
    status: payload.status,
    status_updated_at: payload.status_updated_at,
    tags: payload.tags?.split(',').map((tag) => tag.trim()),
    time_zone: payload.timezone
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify person in Drip',
  defaultSubscription: 'type = "identify"',
  fields: {
    custom_fields: {
      description: "Custom fields to add to a person's profile.",
      label: 'Custom fields',
      required: false,
      type: 'object', // dictionary of strings to strings
      default: { '@path': '$.properties.custom_fields' }
    },
    email: {
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
    phone: {
      description: "The person's sms number.",
      label: 'SMS Number',
      required: false,
      type: 'string',
      default: { '@path': '$.traits.phone' }
    },
    status: {
      description: "The person's subscription status.",
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
      description: 'Tags to add to a person\'s profile. Should be a comma separated list. e.g. "tag1,tag2".',
      label: 'Tags',
      required: false,
      type: 'string',
      default: { '@path': '$.properties.tags' }
    },
    timezone: {
      description: "The person's timezone.",
      label: 'Timezone',
      required: false,
      type: 'string',
      default: { '@path': '$.context.timezone' }
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`https://api.getdrip.com/v2/${settings.accountId}/subscribers`, {
      method: 'POST',
      json: person(payload)
    })
  },
  performBatch: (request, { settings, payload }) => {
    return request(`https://api.getdrip.com/v2/${settings.accountId}/subscribers/batches`, {
      method: 'POST',
      json: { subscribers: payload.map(person) }
    })
  }
}

export default action
