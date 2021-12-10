import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

const MME_E2E_URLS = [
  'https://mme-e2e.segment.com',
  'https://mme-e2e.segment.build'
]

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
    data: {
      label: 'Data',
      description: 'Payload to deliver to webhook URL (JSON-encoded).',
      type: 'object',
      default: { '@path': '$.' }
    }
  },
  perform: (request, { payload }) => {
    if (!MME_E2E_URLS.includes(payload.url)) {
      throw new IntegrationError(`invalid url '${payload.url}'`, 'Bad Request', 400)
    }

    return request(payload.url, {
      method: payload.method as RequestMethod,
      json: payload.data
    })
  },
  performBatch: (request, { payload }) => {
    // Expect these to be the same across the payloads
    const { url, method } = payload[0]

    if (!MME_E2E_URLS.includes(url)) {
      throw new IntegrationError(`invalid url '${url}'`, 'Bad Request', 400)
    }

    return request(url, {
      method: method as RequestMethod,
      json: payload.map(({ data }) => data)
    })
  }
}

export default action
