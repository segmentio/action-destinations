import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Create Cordial ContactActivity',
  fields: {
    user_id: {
      label: 'Segment ID',
      description: 'Segment User ID',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Segment Anonymous ID',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    event: {
      label: 'Event name',
      description: 'Segment event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    sentAt: {
      label: 'Event sentAt',
      description: 'Segment event sentAt',
      type: 'datetime',
      default: {
        '@path': '$.sentAt'
      }
    },
    context: {
      label: 'Event context',
      description: 'Segment event context',
      type: 'object',
      default: {
        '@path': '$.context'
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
    const trackEndpoint = `${settings.endpoint}/track`
    return request(trackEndpoint, {
      method: 'post',
      json: payload
    })
  }
}

export default action
