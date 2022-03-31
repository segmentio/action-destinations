import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, audienceId, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profile',
  description: 'This synchronizes customer profile data concerning audiences and attributes.',
  fields: {
    attributes: { ...attribute },
    customerProfileId: { ...customerProfileId },
    deleteAudienceIDs: { ...audienceId },
    addAudienceIDs: { ...audienceId },
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
          adds: payload.addAudienceIDs,
          deletes: payload.deleteAudienceIDs
        },
        runRuleEngine: payload.runRuleEngine
      }
    })
  }
}

export default action
