import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { audienceId, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Audience',
  description: 'This synchronizes audience data if there is an existing audience entity.',
  fields: {
    audienceId: { ...audienceId },
    customerProfileId: { ...customerProfileId }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/customer_profiles/audiences`, {
      method: 'put',
      json: {
        data: [
          {
            customerProfileId: payload.customerProfileId,
            adds: payload.audienceId,
            deletes: payload.audienceId
          }
        ]
      }
    })
  }
}

export default action
