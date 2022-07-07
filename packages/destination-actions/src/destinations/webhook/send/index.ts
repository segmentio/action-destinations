import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

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
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'GET', value: 'GET' }
      ],
      default: 'POST',
      required: true
    },
    headers: {
      label: 'Headers',
      description: 'HTTP headers to send with each request.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    timeout: {
      label: 'Timeout',
      description: 'Time in milliseconds when a request should be aborted. Default is 10000',
      type: 'number',
      default: 10000
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
      json: payload.data,
      timeout: payload.timeout
    })
  },
  performBatch: (request, { payload }) => {
    // Expect these to be the same across the payloads
    const { url, method, headers, timeout } = payload[0]

    return request(url, {
      method: method as RequestMethod,
      headers: headers as Record<string, string>,
      json: payload.map(({ data }) => data),
      timeout
    })
  }
}

export default action
