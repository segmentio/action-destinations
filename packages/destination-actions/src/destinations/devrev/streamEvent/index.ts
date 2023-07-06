import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackEventsPublishBody, devrevApiPaths, devrevApiRoot } from '../utils'
import { RequestOptions } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Stream Event',
  description: 'Stream events to DevRev',
  platform: 'cloud',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      label: 'Event Name',
      description: 'Name of the event',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    timestamp: {
      label: 'Event Timestamp',
      description: `The time when this event occurred. If this isn't set, the current time will be used.`,
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    userId: {
      label: 'User ID',
      description: 'User ID, ideally mappable to external ref of a Rev User.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    email: {
      label: 'Email Address',
      description: 'The email of the contact associated with this event.',
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    properties: {
      label: 'Properties',
      description: 'A json object containing additional information about the event.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    messageId: {
      label: 'Message Id',
      description: 'The Segment messageId',
      type: 'string',
      required: false,
      default: { '@path': '$.messageId' }
    },
    context: {
      label: 'Event context',
      description: 'Event context as it appears in Segment',
      type: 'object',
      required: false,
      default: { '@path': '$.context' }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID associated with the user',
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    }
  },
  perform: (request, { payload }) => {
    const { eventName, timestamp } = payload

    // Track API payload
    const reqBody: TrackEventsPublishBody = {
      events_list: [
        {
          name: eventName,
          event_time: timestamp.toString(),
          payload: {
            // add mapped data to payload
            ...payload
          }
        }
      ]
    }
    const url = `${devrevApiRoot}${devrevApiPaths.trackEventsPublish}`
    const options: RequestOptions = {
      method: 'POST',
      json: reqBody
    }

    return request(url, options)
  }
}

export default action
