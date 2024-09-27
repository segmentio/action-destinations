import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { endpointUrl } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Track a user action in Accoil',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      required: true,
      default: { '@path': '$.userId' }
    },
    timestamp: commonFields.timestamp
  },
  perform: (request, { payload, settings }) => {
    return request(endpointUrl(settings.api_key), {
      method: 'post',
      json: {
        type: 'track',
        event: payload.event,
        userId: payload.userId,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
