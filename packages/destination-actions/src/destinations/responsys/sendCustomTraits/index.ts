import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { sendCustomTraits, getUserDataFieldNames, validateCustomTraitsSettings } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Traits',
  description: 'Send Custom Traits to a Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify"',
  fields: {
    userData: {
      label: 'Recepient Data',
      description: 'Record data that represents field names and corresponding values for each profile.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      properties: {
        EMAIL_ADDRESS_: {
          label: 'Email address',
          description: "The user's email address",
          type: 'string',
          format: 'email',
          required: false
        },
        CUSTOMER_ID_: {
          label: 'Customer ID',
          description: 'Responsys Customer ID.',
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_: { '@path': '$.traits.email' },
        CUSTOMER_ID_: { '@path': '$.userId' }
      }
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    validateCustomTraitsSettings(data.settings)

    return sendCustomTraits(request, [data.payload], data.settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    validateCustomTraitsSettings(data.settings)

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
