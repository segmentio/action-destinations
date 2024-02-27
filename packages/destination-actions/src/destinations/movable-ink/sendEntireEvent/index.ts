import { ActionDefinition, PayloadValidationError, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Entire Event',
  description: 'Send an entire Segment event to Movable Ink',
  fields: {
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
    const url = settings.movable_ink_url
    if (!url)
      throw new IntegrationError(
        '"Movable Ink URL" setting or "Movable Ink URL" field must be populated',
        'MISSING_DESTINATION_URL',
        400
      )

    try {
      return request(url, {
        method: 'POST',
        headers: payload.headers as Record<string, string>,
        json: payload.data
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  }
}

export default action
