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
    audienceId: { ...audienceId },
    runRuleEngine: {
      label: 'This runs rule engine in talon-service upon updating customer profile',
      description: 'Set to true if the update requires to trigger all the rules.',
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
          adds: payload.audienceId,
          deletes: payload.audienceId
        },
        runRuleEngine: payload.runRuleEngine
      }
    })
  }
}

export default action
