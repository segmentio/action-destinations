import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, audiencesToAdd, audiencesToDelete, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Profile V2',
  description: 'You do not have to create attributes or audiences before using this endpoint.',
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
    attributesInfo: {
      label: 'Attributes info',
      description: 'Use this field if you want to identify an attribute with a specific type',
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
