import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { addAudienceId, customerProfileId, deleteAudienceId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Multiple Customer Profiles’ Audiences',
  description: 'This updates audiences for multiple customer profiles.',
  fields: {
    data: {
      label: 'Data item to change customer profile audiences',
      description:
        'An array of JSON objects that contains customer profile identifier and list of audiences to associate and dissociate with the indicated customer profile. Customer profile ID and at least one audience ID are required.',
      type: 'object',
      multiple: true,
      properties: {
        customerProfileId: { ...customerProfileId },
        adds: { ...addAudienceId },
        deletes: { ...deleteAudienceId }
      },
      required: true
    }
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
