import type { ActionDefinition } from '@segment/actions-core'
import dayjs from 'dayjs'
import chunk from 'lodash/chunk'
import { baseUrl } from '../constants'
import { enable_batching } from '../fields'
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
      description: 'The ID of the user to send events for',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
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
    },
    enable_batching: enable_batching
  },
  perform: (request, data) => {
    // Send a single event
    return request(`${baseUrl}/events`, {
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
  },
  performBatch: (request, data) => {
    // Send multiple events in batches of 500
    const eventChunks = chunk(data.payload, 500)
    return Promise.all(
      eventChunks.map((events) => {
        return request(`${baseUrl}/events`, {
          json: {
            events: events.map((event) => ({
              ...event,
              /**
               * Toplyne API expects a timestamp in Unix time (seconds since epoch)
               */
              timestamp: dayjs(event.timestamp).unix()
            }))
          }
        })
      })
    )
  }
}

export default action
