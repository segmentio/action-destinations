import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type RequestMethod = 'POST' | 'PUT' | 'PATCH'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send an HTTP request.',
  fields: {
    email: {
      label: 'Email address',
      description: 'User email address',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    audience_name: {
      label: 'Audience Name',
      description: 'Audience name',
      type: 'string',
      choices: [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' }
      ],
      default: 'POST',
      required: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      default: 0
    },
    headers: {
      label: 'Headers',
      description: 'HTTP headers to send with each request.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    traits_or_properties: {
      label: 'Traits or properties object',
      description: 'Traits or properties object',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    }
  },
  perform: (request, { payload }) => {
    return request(payload.url, {
      method: payload.method as RequestMethod,
      headers: payload.headers as Record<string, string>,
      json: payload.data
    })
  },
  performBatch: (request, { payload }) => {
    // Expect these to be the same across the payloads
    const { url, method, headers } = payload[0]

    return request(url, {
      method: method as RequestMethod,
      headers: headers as Record<string, string>,
      json: payload.map(({ data }) => data)
    })
  }
}

export default action
