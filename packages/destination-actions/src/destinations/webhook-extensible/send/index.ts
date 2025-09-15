import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
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
      description: 'HTTP headers to send with each request. Only ASCII characters are supported.',
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
    try {
      let body
      let contentType = 'application/json'

      if (payload.headers) {
        contentType = (payload.headers['Content-Type'] as string) || (payload.headers['content-type'] as string)
      }

      if (payload.data) {
        body = encodeBody(payload.data, contentType)
      }

      return request(payload.url, {
        method: payload.method as RequestMethod,
        headers: payload.headers as Record<string, string>,
        ...body
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  },
  performBatch: (request, { payload }) => {
    // Expect these to be the same across the payloads
    try {
      const { url, method, headers } = payload[0]
      return request(url, {
        method: method as RequestMethod,
        headers: headers as Record<string, string>,
        json: payload.map(({ data }) => {
          let contentType = 'application/json'

          if (headers) {
            contentType = (headers['Content-Type'] as string) || (headers['content-type'] as string)
          }
          if (data) return encodeBody(data, contentType)

          return data
        })
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  }
}

const encodeBody = (payload: Record<string, any>, contentType: string) => {
  if (contentType === 'application/json') {
    return { json: payload }
  } else if (contentType === 'application/x-www-form-urlencoded') {
    const formUrlEncoded = new URLSearchParams(payload as Record<string, string>).toString()
    return { body: formUrlEncoded }
  } else {
    // Handle other content types or default case
    return { json: payload }
  }
}

export default action
