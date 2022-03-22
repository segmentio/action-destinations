import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { dataItem } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profiles Audiences',
  description: 'This synchronizes audience data for multiple customer profiles.',
  fields: {
    data: { ...dataItem, required: true }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/customer_profiles/audiences`, {
      method: 'put',
      json: {
        data: payload.data
      }
    })
  }
}

export default action
