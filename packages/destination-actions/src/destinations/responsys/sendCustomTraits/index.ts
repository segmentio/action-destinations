import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { sendCustomTraits, getUserDataFieldNames, validateCustomTraits, validateListMemberPayload } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Traits',
  description: 'Send Custom Traits to a Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify"',
  fields: {
    userData: {
      label: 'Recipient Data',
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
    batch_size: batch_size,
    stringify: {
      label: 'Stringify Recipient Data',
      description: 'If true, all Recipient data will be converted to strings before being sent to Responsys.',
      type: 'boolean',
      required: true,
      default: false
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: async (request, data) => {
    const { payload, settings, statsContext } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    validateCustomTraits({ profileExtensionTable: settings.profileExtensionTable, timestamp: payload.timestamp, statsContext: statsContext })

    validateListMemberPayload(payload.userData)

    return sendCustomTraits(request, [payload], settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const { payload, settings, statsContext } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    validateCustomTraits({ profileExtensionTable: settings.profileExtensionTable, timestamp: payload[0].timestamp, statsContext: statsContext })

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
