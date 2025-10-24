import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Send user traits to Survicate',
  platform: 'cloud',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
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
        '@path': '$.traits'
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
    const { traits, anonymousId, userId, timestamp } = payload

    if (!userId && !anonymousId) {
      throw new PayloadValidationError("'User ID' or 'Anonymous ID' is required")
    }

    return request(`https://integrations.survicate.com/endpoint/segment/identify`, {
      method: 'post',
      json: {
        ...(userId ? { userId } : {}),
        ...(anonymousId ? { anonymousId } : {}),
        traits,
        timestamp
      }
    })
  }
}

export default action
