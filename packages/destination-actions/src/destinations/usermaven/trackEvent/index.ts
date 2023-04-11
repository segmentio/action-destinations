import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { trackEventRequestParams } from '../request-params'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: '',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The user ID.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    event: {
      label: 'Event Type',
      description: 'The event type.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    eventAttributes: {
      label: 'Event Attributes',
      description: 'The event attributes.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.attributes'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const { url, options } = trackEventRequestParams(settings, payload.userId, payload.event, payload.eventAttributes)
    return request(url, options)
  }
}

export default action
