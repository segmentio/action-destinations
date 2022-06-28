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
      default: true
    },
    attributesInfo: {
      label: 'Attributes with types',
      description: 'Use this field if you want to identify an attribute as a specific type',
      type: 'object',
      required: false,
      multiple: true,
      properties: {
        name: {
          label: 'Name',
          description: 'Attribute name',
          type: 'string',
          required: true
        },
        type: {
          label: 'Type',
          description: 'Attribute type. Can be only `string`, `time`, `number`, `boolean`, `location`',
          type: 'string',
          default: 'string',
          required: true
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.attributesInfo',
          {
            name: {
              '@path': '$.name'
            },
            type: {
              '@path': '$.type'
            }
          }
        ]
      }
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
        runRuleEngine: payload.runRuleEngine,
        attributesInfo: payload.attributesInfo
      }
    })
  }
}

export default action
