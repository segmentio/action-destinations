import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Send user traits to Survicate',
  platform: 'cloud',
  defaultSubscription: 'type = "identify"',
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
      description: 'An anonymous id',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'The Segment traits to be forwarded to Survicate',
      label: 'Traits',
      default: {
        '@path': '$.traits',
        '@fallback': {
          '@path': '$.context.traits'
        }
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
    const { traits, anonymous_id, user_id, timestamp } = payload

    if (!user_id && !anonymous_id) {
      throw new PayloadValidationError("'User ID' or 'Anonymous ID' is required")
    }

    return request(`https://integrations.survicate.com/endpoint/segment/identify`, {
      method: 'post',
      json: {
        ...(user_id ? { user_id } : {}),
        ...(anonymous_id ? { anonymous_id } : {}),
        traits,
        timestamp
      }
    })
  }
}

export default action
