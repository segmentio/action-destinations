import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, customerProfileId } from '../t1-properties'

const TARGET_EVENT_TYPE = 'string'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'This records a custom event in Talon.One.',
  fields: {
    customerProfileId: {
      ...customerProfileId,
      description:
        'The customer profile integration ID to use in Talon.One. It is the identifier of the customer profile associated to the event.'
    },
    eventType: {
      label: 'Event Type',
      description: 'The name of the event sent to Talon.One.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    type: {
      label: 'Type',
      description: 'Type of event. Can be only `string`, `time`, `number`, `boolean`, `location`',
      type: 'string',
      required: true,
      default: TARGET_EVENT_TYPE
    },
    attributes: {
      ...attribute,
      default: {
        '@path': '$.properties'
      },
      description:
        'Extra attributes associated with the event. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).'
    },
    attributesInfo: {
      label: 'Attributes info',
      description: 'Use this field you want to specify an attribute type',
      type: 'object',
      required: false,
      multiple: true,
      properties: {
        name: {
          label: 'Name',
          description: 'Attribute name',
          type: 'string',
          required: true
        },
        type: {
          label: 'Type',
          description: 'Attribute type. Can be only `string`, `time`, `number`, `boolean`, `location`',
          type: 'string',
          default: 'string',
          required: true,
          choices: [
            {
              value: 'string',
              label: 'string'
            },
            {
              value: 'time',
              label: 'time'
            },
            {
              value: 'number',
              label: 'number'
            },
            {
              value: 'boolean',
              label: 'boolean'
            },
            {
              value: 'location',
              label: 'location'
            }
          ]
        }
      }
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
        eventAttributes: payload.attributes,
        attributesInfo: payload.attributesInfo
      }
    })
  }
}

export default action
