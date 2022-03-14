import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profile AVPs (attribute-value pair).',
  description: 'This synchronizes attributes data for multiple customer profiles.',
  fields: {
    data: {
      label: 'Data is an object that stores data items.',
      description: 'You should have this object as it is necessary to store at least one data item.',
      type: 'object',
      multiple: true,
      required: true
    },
    customerProfileId: { ...customerProfileId },
    attributes: { ...attribute },
    mutualAttributes: { ...attribute }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/customer_profiles/attributes`, {
      method: 'put',
      json: {
        data: [
          {
            customerProfile: payload.customerProfileId,
            attributes: payload.attributes
          }
        ],
        mutualAttributes: payload.attributes
      }
    })
  }
}

export default action
