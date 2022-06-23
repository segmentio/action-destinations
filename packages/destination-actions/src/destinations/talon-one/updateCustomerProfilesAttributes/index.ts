import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Multiple Customer Profiles’ Attributes',
  description: 'This updates attributes for multiple customer profiles.',
  fields: {
    data: {
      label: 'Data item to change customer profile attributes',
      description:
        'An array of JSON objects that contains customer profile identifier and list of attributes and their values. Customer profile ID is required.',
      type: 'object',
      multiple: true,
      properties: {
        customerProfileId: { ...customerProfileId },
        attributes: { ...attribute }
      },
      required: true
    },
    mutualAttributes: {
      ...attribute,
      label: 'Mutual Attribute-Value pairs',
      description:
        'This may contain mutual list of attributes and their values for every customer profile in the "data" array.'
    },
    attributesInfo: {
      label: 'Attributes with types',
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
    return request(`https://integration.talon.one/segment/customer_profiles/attributes`, {
      method: 'put',
      json: {
        data: payload.data,
        mutualAttributes: payload.mutualAttributes,
        attributesInfo: payload.attributesInfo
      }
    })
  }
}

export default action
