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
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/customer_profiles/attributes`, {
      method: 'put',
      json: {
        data: payload.data,
        mutualAttributes: payload.mutualAttributes
      }
    })
  }
}

export default action
