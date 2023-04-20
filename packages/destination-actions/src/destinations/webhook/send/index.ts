import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type RequestMethod = 'POST' | 'PUT' | 'PATCH'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send an HTTP request.',
  fields: {
    url: {
      label: 'URL',
      description: 'URL to deliver data to.',
      type: 'string',
      required: true,
      format: 'uri'
    },
    method: {
      label: 'Method',
      description: 'HTTP method to use.',
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
    data: {
      label: 'Data',
      description: 'Payload to deliver to webhook URL (JSON-encoded).',
      type: 'object',
      default: { '@path': '$.' }
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
