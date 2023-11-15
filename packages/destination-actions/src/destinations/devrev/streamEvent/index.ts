import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackEventsPublishBody, devrevApiPaths, getBaseUrl } from '../utils'
import { RequestOptions } from '@segment/actions-core'
import { v4 as uuidv4 } from '@lukeed/uuid'

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
      description: 'User ID as received from Segment.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    userRef: {
      label: 'User Ref',
      description: 'User Ref, ideally mappable to external ref of a Rev User.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.userRef' },
          then: { '@path': '$.traits.userRef' },
          else: { '@path': '$.integrations.DevRev.userRef' }
        }
      }
    },
    accountRef: {
      label: 'Account Ref',
      description: 'Account Ref, ideally mappable to external ref of a Rev Account.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.accountRef' },
          then: { '@path': '$.traits.accountRef' },
          else: { '@path': '$.integrations.DevRev.accountRef' }
        }
      }
    },
    workspaceRef: {
      label: 'Workspace Ref',
      description: 'Workspace Ref, ideally mappable to external ref of a Rev Workspace.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.workspaceRef' },
          then: { '@path': '$.traits.workspaceRef' },
          else: { '@path': '$.integrations.DevRev.workspaceRef' }
        }
      }
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
  perform: (request, { settings, payload }) => {
    const { eventName, timestamp } = payload

    // Track API payload
    const reqBody: TrackEventsPublishBody = {
      events_list: [
        {
          name: eventName,
          event_time: timestamp.toString(),
          event_id: payload.messageId || uuidv4(),
          payload: {
            // add mapped data to payload
            ...payload,
            devrev_source_identifier: 'segment'
          }
        }
      ]
    }
    const url = `${getBaseUrl(settings)}${devrevApiPaths.trackEventsPublish}`
    const options: RequestOptions = {
      method: 'POST',
      json: reqBody
    }

    return request(url, options)
  }
}

export default action
