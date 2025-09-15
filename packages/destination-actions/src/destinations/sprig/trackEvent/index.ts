import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { payloadTransform } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Sprig.',
  fields: {
    eventName: {
      description: 'The event to be sent to Sprig.',
      label: 'Event Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      description: 'The timestamp of the event.',
      label: 'Event Timestamp',
      required: true,
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    userId: {
      description: 'The userId of the identified user.',
      label: 'User ID',
      required: true,
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, data) => {
    return request('https://api.sprig.com/v2/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.settings.apiKey}`
      },
      json: payloadTransform(data.payload)
    })
  }
}

export default action
