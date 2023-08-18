import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, addAudienceId, deleteAudienceId, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update customer profile',
  description:
    'This updates attributes and audiences for a single customer profile. Create all the required attributes and audiences before using this endpoint.',
  fields: {
    customerProfileId: { ...customerProfileId },
    skipNonExistingAttributes: {
      type: 'boolean',
      label: 'Skip Non-existing Attributes Flag',
      description:
        'Indicates whether to skip non-existing attributes. If `Yes`, the non-existing attributes are skipped and a 400 error is not returned. If `No`, a 400 error is returned in case of non-existing attributes.',
      default: false,
      required: false
    },
    deleteAudienceIds: { ...deleteAudienceId },
    addAudienceIds: { ...addAudienceId },
    runRuleEngine: {
      label: 'Run rule engine',
      description: 'This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.',
      type: 'boolean',
      default: true
    },
    attributes: { ...attribute }
  },
  perform: (request, { payload }) => {
    let requestUrl = `https://integration.talon.one/segment/v2/customer_profiles/${payload.customerProfileId}`
    if (payload.skipNonExistingAttributes) {
      requestUrl += '?skipNonExistingAttributes=true'
    }
    return request(requestUrl, {
      method: 'put',
      json: {
        audiencesChanges: {
          adds: payload.addAudienceIds,
          deletes: payload.deleteAudienceIds
        },
        runRuleEngine: payload.runRuleEngine,
        attributes: payload.attributes
      }
    })
  }
}

export default action
