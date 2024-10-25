import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseUrl } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Identify a user',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      label: 'User ID',
      type: 'string',
      required: true,
      description: 'The user identifier to associate the event with',
      default: { '@path': '$.userId' }
    },
    messageId: {
      label: 'Message ID',
      type: 'string',
      description: 'A unique value for each event.',
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Event Timestamp',
      type: 'string',
      required: true,
      description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
      default: { '@path': '$.timestamp' }
    },
    traits: {
      label: 'User Traits',
      type: 'object',
      required: false,
      description: 'User profile information',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { payload }) => {
    return request(baseUrl, {
      method: 'POST',
      json: {
        userId: payload.userId,
        messageId: payload.messageId,
        timestamp: payload.timestamp,
        traits: payload.traits
      }
    })
  }
}

export default action
