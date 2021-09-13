import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post JSON',
  description: 'POST JSON to a custom URL',
  fields: {
    url: {
      label: 'URL',
      description: 'URL to deliver JSON-encoded message to.',
      type: 'string',
      required: true,
      format: 'uri'
    },
    body: {
      label: 'Body',
      description: 'Message to deliver to webhook URL (JSON-encoded).',
      type: 'object',
      default: { '@path': '$.' }
    }
  },
  perform: (request, { payload }) => {
    return request(payload.url, {
      method: 'post',
      json: payload.body
    })
  }
}

export default action
