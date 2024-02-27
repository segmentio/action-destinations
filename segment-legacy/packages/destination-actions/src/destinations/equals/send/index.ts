import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  defaultSubscription: 'type = track or type = page or type = screen or type = identify or type = group',
  description: 'Send Segment analytics data to Equals',
  fields: {
    data: {
      label: 'Data',
      description: 'Payload to deliver to Equals. Detaults to sending the entire Segment payload.',
      type: 'object',
      required: true,
      defaultObjectUI: 'object',
      default: { '@path': '$.' }
    }
  },
  perform: (request, { payload, settings }) => {
    try {
      return request(settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Segment Equals Destination'
        },
        json: payload.data
      })
    } catch (error) {
      if (error instanceof TypeError) {
        throw new PayloadValidationError(error.message)
      }
      throw error
    }
  }
}

export default action
