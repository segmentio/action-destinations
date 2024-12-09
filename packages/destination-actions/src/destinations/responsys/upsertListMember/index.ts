import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared-properties'
import { upsertListMembers, getUserDataFieldNames, validateListMemberPayload } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile List Member',
  description: 'Create or update a Profile List Member in Responsys',
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
          label: 'Email Address',
          description: "The user's email address.",
          type: 'string',
          format: 'email',
          required: false
        },
        EMAIL_MD5_HASH_: {
          label: 'Email Address MD5 Hash',
          description: "An MD5 Hash of the user's email address.",
          type: 'string',
          required: false
        },
        EMAIL_SHA256_HASH_: {
          label: 'Email Address SHA256 Hash',
          description: "A SHA256 Hash of the user's email address.",
          type: 'string',
          required: false
        },
        RIID_: {
          label: 'Recipient ID',
          description: 'Recipient ID (RIID).  RIID is required if Email Address is empty.',
          type: 'string',
          required: false
        },
        CUSTOMER_ID_: {
          label: 'Customer ID',
          description: 'Responsys Customer ID.',
          type: 'string',
          required: false
        },
        MOBILE_NUMBER_: {
          label: 'Mobile Number',
          description: "The user's Mobile Phone Number.",
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_: { '@path': '$.traits.email' },
        EMAIL_MD5_HASH_: { '@path': '$.traits.email_md5_hash_' },
        EMAIL_SHA256_HASH_: { '@path': '$.traits.email_sha256_hash' },
        CUSTOMER_ID_: { '@path': '$.userId' },
        MOBILE_NUMBER_: { '@path': '$.traits.phone' }
      }
    },
    stringify: {
      label: 'Stringify Recipient Data',
      description: 'If true, all Recipient data will be converted to strings before being sent to Responsys.',
      type: 'boolean',
      required: true,
      default: false
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)
    // const transformedSettings = transformDataFieldValues(data.settings)
    validateListMemberPayload(data.payload.userData)

    return upsertListMembers(request, [data.payload], data.settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    return upsertListMembers(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
