import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../rsp-properties'
import { sendConnectionsPETData } from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Custom Traits to Profile Extension Table',
  description: 'Sync Custom Traits to Profile Extension Table records.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userData: {  
      label: 'Recepient Data', 
      description: 'Record data that represents Field Names and corresponding values for the Recipient.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true, 
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
          description: "Responsys Customer ID.",
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_ : {'@path': '$.traits.email' },
        CUSTOMER_ID_ : { '@path': '$.userId' }
      }
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, { settings, payload }) => {
    return sendConnectionsPETData(request, [payload], settings)
  },

  performBatch: async (request, { settings, payload }) => {
    return sendConnectionsPETData(request, payload, settings)
  }
}

export default action
