import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track an event for a known person.',
  defaultSubscription: 'type = "track"',
  fields: {
    id: {
      label: 'Person ID',
      description: 'ID of the person who triggered this event.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Anonymous ID of the person who triggered this event.',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    name: {
      label: 'Event Name',
      description: 'Name of the event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    type: {
      label: 'Event Type',
      description: 'Override event type. Ex. "page".',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    data: {
      label: 'Data',
      description: 'Custom data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: (request, { payload }) => {
    if (payload.id !== undefined) {
      return request(`https://track.customer.io/api/v1/customers/${payload.id}/events`, {
        method: 'post',
        json: {
          name: payload.name,
          type: payload.type,
          data: payload.data
        }
      })
    } else {
      return request('https://track.customer.io/api/v1/events', {
        method: 'post',
        json: {
          anonymous_id: payload.anonymous_id,
          name: payload.name,
          type: payload.type,
          data: payload.data
        }
      })
    }
  }
}

export default action
