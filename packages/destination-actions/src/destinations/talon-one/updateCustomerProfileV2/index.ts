import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, attributesInfo, audiencesToAdd, audiencesToDelete, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: '[Deprecated] Upsert customer profile V2',
  description: `You do not have to create attributes or audiences before using this Action. **Important:** This Action is deprecated. Use the **Update customer profile** Action instead.`,
  fields: {
    customerProfileId: { ...customerProfileId },
    audiencesToAdd: { ...audiencesToAdd },
    audiencesToDelete: { ...audiencesToDelete },
    runRuleEngine: {
      label: 'Run rule engine',
      description: 'This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.',
      type: 'boolean',
      default: true
    },
    attributes: { ...attribute },
    attributesInfo: { ...attributesInfo }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/customer_profile_v2/${payload.customerProfileId}`, {
      method: 'put',
      json: {
        audiencesChanges: {
          adds: payload.audiencesToAdd,
          deletes: payload.audiencesToDelete
        },
        runRuleEngine: payload.runRuleEngine,
        attributes: payload.attributes,
        attributesInfo: payload.attributesInfo
      }
    })
  }
}

export default action
