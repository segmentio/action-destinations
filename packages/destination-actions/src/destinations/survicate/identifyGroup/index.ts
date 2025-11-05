import { PayloadValidationError, ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Group',
  description: 'Send group traits to Survicate',
  defaultSubscription: 'type = "group"',
  platform: 'cloud',
  fields: {
    user_id: {
      type: 'string',
      required: true,
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
    group_id: {
      type: 'string',
      required: true,
      description: 'The group id',
      label: 'Group ID',
      default: { '@path': '$.groupId' }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'The Segment traits to be forwarded to Survicate',
      label: 'Group traits',
      default: { '@path': '$.traits' }
    },
    timestamp: {
      type: 'string',
      required: true,
      format: 'date-time',
      description: 'The timestamp of the event.',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    }
  },
  perform: (request, { payload }) => {
    const { user_id, anonymous_id, group_id, traits, timestamp } = payload

    if (!user_id && !anonymous_id) {
      throw new PayloadValidationError("'User ID' or 'Anonymous ID' is required")
    }

    return request(`https://integrations.survicate.com/endpoint/segment/group`, {
      method: 'post',
      json: {
        ...(user_id ? { user_id } : {}),
        ...(anonymous_id ? { anonymous_id } : {}),
        group_id,
        traits: Object.fromEntries(Object.entries(traits).map(([key, value]) => [`group_${key}`, value])),
        timestamp
      }
    })
  }
}

export default action
