import { PayloadValidationError, ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send events to Survicate',
  platform: 'cloud',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      type: 'string',
      required: false,
      description: 'An anonymous user id',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    name: {
      description: 'The event name',
      label: 'Event Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'Object containing the properties of the event',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      type: 'string',
      required: true,
      format: 'date-time',
      description: 'The timestamp of the event.',
      label: 'Timestamp',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload }) => {
    const { user_id, anonymous_id, name, properties, timestamp } = payload

    if (!user_id && !anonymous_id) {
      throw new PayloadValidationError("'User ID' or 'Anonymous ID' is required")
    }

    return request(`https://integrations.survicate.com/endpoint/segment/track`, {
      method: 'post',
      json: {
        name,
        ...(user_id ? { user_id } : {}),
        ...(anonymous_id ? { anonymous_id } : {}),
        ...(properties ? { properties } : {}),
        timestamp
      }
    })
  }
}

export default action
