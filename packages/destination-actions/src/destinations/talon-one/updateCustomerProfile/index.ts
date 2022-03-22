import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { addAudienceId, attribute, customerProfileId, deleteAudienceId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profile',
  description: 'This synchronizes customer profile data concerning audiences and attributes.',
  fields: {
    attributes: { ...attribute },
    customerProfileId: { ...customerProfileId },
    audiencesChanges: {
      label: 'Set audience changes',
      description: 'This composes 2 lists of audience; to associate and dissociate with the customer profile.',
      type: 'object',
      properties: {
        addAudienceIds: { ...addAudienceId },
        deleteAudienceIds: { ...deleteAudienceId }
      },
      required: false
    },
    runRuleEngine: {
      label: 'Run rule engine',
      description: 'This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.',
      type: 'boolean',
      default: false
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/customer_profile/${payload.customerProfileId}`, {
      method: 'put',
      json: {
        attributes: payload.attributes,
        audiencesChanges: payload.audiencesChanges,
        runRuleEngine: payload.runRuleEngine
      }
    })
  }
}

export default action
