import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { encodeHeader } from '../utils'

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
    let { headers } = payload
    if (headers) {
      headers = encodeHeader(headers as Record<string, string>)
    }
    return request(payload.url, {
      method: payload.method as RequestMethod,
      headers: headers as Record<string, string>,
      json: payload.data
    })
  },
  performBatch: (request, { payload }) => {
    // Expect these to be the same across the payloads
    const { url, method } = payload[0]
    let { headers } = payload[0]
    if (headers) {
      headers = encodeHeader(headers as Record<string, string>)
    }

    return request(url, {
      method: method as RequestMethod,
      headers: headers as Record<string, string>,
      json: payload.map(({ data }) => data)
    })
  }
}

export default action
