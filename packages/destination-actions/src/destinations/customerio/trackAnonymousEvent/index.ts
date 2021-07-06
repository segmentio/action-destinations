import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Anonymous Event',
  description: 'Track an event not tied to a known person.',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      label: 'Event Name',
      description: 'Name of the event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    data: {
      label: 'Data',
      description:
        'Custom data to include with the event. If "recipient", "from_address", or "reply_to" are sent, they will override settings on any campaigns triggered by this event. "recipient" is required if the event is used to trigger a campaign.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: (request, { payload }) => {
    return request('https://track.customer.io/api/v1/events', {
      method: 'post',
      json: payload
    })
  }
}

export default action
