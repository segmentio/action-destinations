import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseUrl, headers } from '../utils'

// data = {}
// data[:email] = args[0] if args[0].is_a? String
// data.merge!(args.last) if args.last.is_a? Hash
// raise ArgumentError, 'email: or id: or bigcommerce_subscriber_id: parameter required' if missing_subscriber_identifier(data)
// make_json_api_request :post, "v2/#{account_id}/subscribers", private_generate_resource("subscribers", data)

// 'email',
// 'tags',
// 'new_email', can we ignore this?
// 'ip_address',
// 'time_zone',
// 'potential_lead',
// 'prospect'

const person: (payload: Payload) => any = (payload) => {
  return {
    email: payload.email,
    action: payload.action,
    properties: payload.properties
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
      default: { '@path': '$.context.ip' }
    },
    timezone: {
      description: "The person's timezone.",
      label: 'Timezone',
      required: false,
      type: 'string',
      default: { '@path': '$.context.timezone' }
    },
    tags: {
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
