import type { ActionDefinition } from '@segment/actions-core'
import dayjs from 'dayjs'
import { baseUrl } from '../constants'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send events',
  description: 'Send event track calls to Toplyne',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      type: 'string',
      label: 'User ID',
      description: 'The ID of the user to send events for. Required if anonymousId is not provided',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      type: 'string',
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user to send events for. Required if userId is not provided',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    accountId: {
      type: 'string',
      label: 'Account ID',
      description: 'The ID of the account to send events for',
      required: false,
      default: { '@path': '$.context.groupId' }
    },
    eventName: {
      type: 'string',
      label: 'Event Name',
      description: 'The name of the event to send',
      required: true,
      default: { '@path': '$.event' }
    },
    timestamp: {
      type: 'datetime',
      label: 'Timestamp',
      description: 'The timestamp of the event',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    eventProperties: {
      type: 'object',
      label: 'Event Properties',
      description: 'The properties of the event',
      required: false,
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, data) => {
    // Send a single event
    return request(`${baseUrl}/upload/events`, {
      json: {
        events: [
          {
            ...data.payload,
            /**
             * Toplyne API expects a timestamp in Unix time (seconds since epoch)
             */
            timestamp: dayjs(data.payload.timestamp).unix()
          }
        ]
      }
    })
  }
}

export default action
