import { ActionDefinition, PayloadValidationError, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { movable_ink_url } from '../fields'

type RequestMethod = 'POST' | 'PUT' | 'PATCH'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Entire Event',
  description: 'Send an entire Segment event to Movable Ink',
  fields: {
    movable_ink_url,
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
  perform: (request, { settings, payload }) => {
    const url = payload?.movable_ink_url ?? settings?.movable_ink_url
    if (!url)
      throw new IntegrationError(
        '"Movable Ink URL" setting or "Movable Ink URL" field must be populated',
        'MISSING_DESTINATION_URL',
        400
      )

    try {
      return request(url, {
        method: payload.method as RequestMethod,
        headers: payload.headers as Record<string, string>,
        json: payload.data
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  },
  performBatch: (request, { settings, payload }) => {
    const url = payload[0]?.movable_ink_url ?? settings?.movable_ink_url
    if (!url)
      throw new IntegrationError(
        '"Movable Ink URL" setting or "Movable Ink URL" field must be populated',
        'MISSING_DESTINATION_URL',
        400
      )

    // Expect these to be the same across the payloads
    const { method, headers } = payload[0]
    try {
      return request(url, {
        method: method as RequestMethod,
        headers: headers as Record<string, string>,
        json: payload.map(({ data }) => data)
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  }
}

export default action
