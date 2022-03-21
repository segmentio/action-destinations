import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profile Attribute-Value pairs.',
  description: 'This synchronizes attributes data for multiple customer profiles.',
  fields: {
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
            customerProfileId: payload.customerProfileId,
            attributes: payload.attributes
          }
        ],
        mutualAttributes: payload.mutualAttributes
      }
    })
  }
}

export default action
