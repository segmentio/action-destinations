import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'This records a custom event in Talon.One.',
  fields: {
    customer_profile_id: {
      label: 'customer_profile_id',
      description: 'Unique identifier of the customer profile associated to the event.',
      type: 'string',
      required: true
    },
    event_type: {
      label: 'event_type',
      description: "It's just the name of your event.",
      type: 'string',
      required: true
    },
    type: {
      label: 'type',
      description: 'Type of event. Can be only `string`, `time`, `number`, `boolean`, `location`',
      type: 'string',
      required: true
    },
    event_attributes: {
      label: 'type',
      description: 'Arbitrary additional JSON data associated with the event',
      type: 'object',
      required: false
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/event`, {
      method: 'put',
      json: {
        customer_profile_id: payload.customer_profile_id,
        event_type: payload.event_type,
        type: payload.type,
        event_attributes: payload.event_attributes
      }
    })
  }
}

export default action
