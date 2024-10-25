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
    },
    retry: {
      label: 'Delay (seconds)',
      description: `A delay of the selected seconds will be added before retrying a failed request.
                    Max delay allowed is 600 secs (10 mins). The default is 0 seconds.`,
      type: 'number',
      choices: [
        { label: '0 secs', value: 0 },
        { label: '30 secs', value: 30 },
        { label: '120 secs', value: 120 },
        { label: '300 secs', value: 300 },
        { label: '480 secs', value: 480 },
        { label: '600 secs', value: 600 }
      ],
      required: false,
      unsafe_hidden: true,
      default: 0
    }
  },

  perform: async (request, data) => {
    const { payload, settings, statsContext } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    validateCustomTraits({
      profileExtensionTable: settings.profileExtensionTable,
      timestamp: payload.timestamp,
      statsContext: statsContext,
      retry: payload.retry
    })

    validateListMemberPayload(payload.userData)

    return sendCustomTraits(request, [payload], settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const { payload, settings, statsContext } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    validateCustomTraits({
      profileExtensionTable: settings.profileExtensionTable,
      timestamp: payload[0].timestamp,
      statsContext: statsContext,
      retry: payload[0].retry
    })

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
