import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MultiStatusResponse } from '@segment/actions-core'
import type { JSONLikeObject } from '@segment/actions-core'

const person = (payload: Payload) => {
  return {
    custom_fields: (() => {
      const result = Object.fromEntries(
        Object.entries(payload.custom_fields ?? {})
          .filter(([_, value]) => value !== null)
          .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)])
      )
      return Object.keys(result).length > 0 ? result : undefined
    })(),
    email: payload.email,
    ip_address: payload.ip,
    phone: payload.phone,
    initial_status: payload.initial_status,
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
      description: "Custom fields to add to a person's profile. Non string values will be stringified.",
      label: 'Custom fields',
      required: false,
      type: 'object', // dictionary of strings to strings
      default: { '@path': '$.traits.custom_fields' }
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
    initial_status: {
      description: "The person's subscription status if newly identified.",
      label: 'Initial Status',
      required: false,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.initial_status' },
          then: { '@path': '$.traits.initial_status' },
          else: 'unsubscribed'
        }
      }
    },
    status: {
      description: "The person's subscription status. Overrides initial_status.",
      label: 'Status',
      required: false,
      type: 'string',
      default: { '@path': '$.traits.status' }
    },
    status_updated_at: {
      description: "The timestamp associated with the update to a person's status.",
      label: 'Status Updated At',
      required: false,
      type: 'datetime',
      default: { '@path': '$.traits.status_updated_at' }
    },
    tags: {
      description: 'Comma delimited list of tags to add to a person\'s profile. e.g. "tag1,tag2".',
      label: 'Tags',
      required: false,
      type: 'string',
      default: { '@path': '$.traits.tags' }
    },
    timezone: {
      description: "The person's timezone.",
      label: 'Timezone',
      required: false,
      type: 'string',
      default: { '@path': '$.context.timezone' }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'integer',
      required: false,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.batch_size' },
          then: { '@path': '$.traits.batch_size' },
          else: 1000
        }
      },
      minimum: 1,
      maximum: 1000
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`https://api.getdrip.com/v2/${settings.accountId}/subscribers`, {
      method: 'POST',
      json: { subscribers: [person(payload)] }
    })
  },
  performBatch: async (request, { settings, payload }) => {
    const batchSize = payload[0]?.batch_size ?? 1000
    const multiStatusResponse = new MultiStatusResponse()
    for (let i = 0; i < payload.length; i += batchSize) {
      const chunk = payload.slice(i, i + batchSize)
      const subs = chunk.map(person)
      const response = await request(`https://api.getdrip.com/v2/${settings.accountId}/subscribers/batches`, {
        method: 'POST',
        json: { batches: [{ subscribers: subs }] }
      })
      chunk.forEach((_, index) => {
        multiStatusResponse.pushSuccessResponse({
          status: response.status,
          sent: subs[index],
          body: response.data as JSONLikeObject
        })
      })
    }
    return multiStatusResponse
  }
}

export default action
