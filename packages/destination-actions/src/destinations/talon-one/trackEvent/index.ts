import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'This records a custom event in Talon.One.',
  fields: {
    customerProfileId: {
      label: 'Customer Profile ID',
      description:
        'The customer profile integration ID to use in Talon.One. It is the identifier of the customer profile associated to the event.',
      type: 'string',
      required: true
    },
    eventType: {
      label: 'Event Type',
      description: 'The name of the event sent to Talon.One.',
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
      label: 'Attribute-Value pairs',
      description:
        'Extra attributes associated with the event. [See more details](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes)',
      type: 'object',
      required: false
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
