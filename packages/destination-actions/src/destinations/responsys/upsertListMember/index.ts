import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { upsertListMembers, getUserDataFieldNames, validateListMemberPayload, transformDataFieldValues } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile List Member',
  description: 'Create or update a Profile List Member in Responsys',
  defaultSubscription: 'event = "Profile List Member Created" or event = "Profile List Member Updated"',
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
          label: 'Email Address',
          description: "The user's email address.",
          type: 'string',
          format: 'email',
          required: false
        },
        email_md5_hash_: {
          label: 'Email Address MD5 Hash',
          description: "An MD5 Hash of the user's email address.",
          type: 'string',
          required: false
        },
        email_sha256_hash_: {
          label: 'Email Address SHA256 Hash',
          description: "A SHA256 Hash of the user's email address.",
          type: 'string',
          required: false
        },
        // email_hash_: {
        //   label: 'Email Address Hash (MD5 or SHA256)',
        //   description: "An MD5 or SHA256 Hash of the user's email address.",
        //   type: 'string',
        //   required: false,
        //   choices: [
        //     { label: 'MD5', value: 'MD5' },
        //     { label: 'SHA256', value: 'SHA256' }
        //   ]
        // },
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
        mobile_number_: {
          label: 'Mobile Number',
          description: "The user's Mobile Phone Number.",
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_: { '@path': '$.context.traits.email' },
        email_md5_hash_: { '@path': '$.context.traits.email_md5_hash_' },
        email_sha256_hash_: { '@path': '$.context.traits.email_sha256_hash' },
        CUSTOMER_ID_: { '@path': '$.context.traits.customer_id' },
        mobile_number_: { '@path': '$.context.traits.phone' },
        RIID_: { '@path': '$.userId' }
      }
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)
    const transformedSettings = transformDataFieldValues(data.settings)
    console.log(data)
    console.log(transformedSettings)
    validateListMemberPayload(data.payload.userData)

    return upsertListMembers(request, [data.payload], transformedSettings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    return upsertListMembers(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
