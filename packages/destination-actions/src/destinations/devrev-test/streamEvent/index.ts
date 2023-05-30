import { ActionDefinition } from '@segment/actions-core';
import { DEVREV_DEV_API_ENDPOINT } from '../constants';
import { Settings } from '../generated-types';
import {Payload} from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Stream Event',
  description: 'send events to DevRev',
  platform: 'cloud',
  defaultSubscription: 'type = "track"',
  fields:{
    eventName: {
        label: 'Event Name',
        description:
          'Name of the occured event',
        type: 'string',
        required: true,
        default: {
          '@path': '$.event'
        }
    },
    occurredAt: {
      label: 'Event Timestamp',
      description: "The time when this event occurred. If this isn't set, the current time will be used.",
      type: 'datetime',
      default: {
          '@path': '$.timestamp'
      },
      required: true
    },
    email: {
      label: 'Email Address',
      description:
          'The email of the contact associated with this event.',
      type: 'string',
      format: 'email',
      default: {
          '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
          }
      }
    },
    userId: {
      label: 'User ID',
      description:
          'User ID, ideally mappable to external ref of a Rev User.',
      type: 'string',
      required: true,
      default: { 
          '@path': '$.properties.userId'
      }
    },
    properties: {
      label: 'Properties',
      description:
          'A json object containing additional information about the event.',
      type: 'object',
      required: false,
      default: {
          '@path': '$.properties'
      }
    }
  },
  perform: (request, { settings , payload }) => {
    // console.log(payload)
    const data = {
      event_list:[
        {
          name: payload.eventName,
          payload: {
            // add mapped data to payload
            ...payload,
            // add devOrgId info to payload
            devOrgId: settings.devOrgId,
          }
        }
      ]
    }
    return request(`${DEVREV_DEV_API_ENDPOINT}/track-events.publish`, {
        method: 'POST',
        json: data
    })
  }
}

export default action
