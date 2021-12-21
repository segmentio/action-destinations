import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Contactactivity',
  description: 'Create Cordial Contactactivity from Segment\'s track and page events',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    identifyByKey: {
      label: 'Contact IdentifyBy key',
      description: 'Property key by which Cordial contact should be identified. May be any primary or secondary key (e.g. cID, email, segment_id etc.)',
      type: 'string',
      required: true,
    },
    identifyByValue: {
      label: 'Contact IdentifyBy value',
      description: 'Value for defined key',
      type: 'string',
      required: true,
    },
    a: {
      label: 'Event name',
      description: 'Segment event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    time: {
      label: 'Event sentAt',
      description: 'Segment event sentAt',
      type: 'datetime',
      default: {
        '@path': '$.sentAt'
      }
    },
    properties: {
      label: 'Event properties',
      description: 'Segment event properties',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
  },
  perform: (request, { settings, payload }) => {
    const contactactivityEndpoint = `${settings.endpoint}/v2/contactactivities`;
    return request(contactactivityEndpoint, {
      method: 'post',
      json: payload
    });
  }
}

export default action
