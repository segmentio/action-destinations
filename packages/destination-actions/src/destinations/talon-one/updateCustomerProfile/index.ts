import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { addAudienceId, attribute, customerProfileId, deleteAudienceId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profile',
  description: 'This updates attributes and audiences for a single customer profile.',
  fields: {
    attributes: { ...attribute },
    customerProfileId: { ...customerProfileId },
    deleteAudienceIds: { ...deleteAudienceId },
    addAudienceIds: { ...addAudienceId },
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
        audiencesChanges: {
          adds: payload.addAudienceIds,
          deletes: payload.deleteAudienceIds
        },
        runRuleEngine: payload.runRuleEngine
      }
    })
  }
}

export default action
