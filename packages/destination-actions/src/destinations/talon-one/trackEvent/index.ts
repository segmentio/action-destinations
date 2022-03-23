import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'This records a custom event in Talon.One.',
  fields: {
    customerProfileId: {
      ...customerProfileId,
      description: 'Unique identifier of the customer profile associated to the event.'
    },
    eventType: {
      label: 'Event Type',
      description: 'It is just the name of your event.',
      type: 'string',
      required: true
    },
    type: {
      label: 'Type',
      description: 'Type of event. Can be only `string`, `time`, `number`, `boolean`, `location`',
      type: 'string',
      required: true
    },
    attributes: {
      ...attribute,
      description: 'Arbitrary additional JSON data associated with the event.'
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/event`, {
      method: 'put',
      json: {
        customerProfileId: payload.customerProfileId,
        eventType: payload.eventType,
        type: payload.type,
        eventAttributes: payload.attributes
      }
    })
  }
}

export default action
