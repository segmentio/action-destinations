import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { sendCustomTraits, getUserDataFieldNames, validateListMemberPayload } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile List Member',
  description: 'Create or update a Profile List Member in Responsys',
  defaultSubscription: 'event = "Profile List Member Created" or event = "Profile List Member Updated"',
  fields: {
    userData: {
      label: 'Recepient Data',
      description: '<TODO>>',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      properties: {
        email_address_: {
          label: 'Email address',
          description: "The user's email address. Email is required if Recipient ID is empty.",
          type: 'string',
          format: 'email',
          required: false
        },
        riid_: {
          label: 'Recipient ID',
          description: 'Recipient ID (RIID).  RIID is required if Email Address is empty.',
          type: 'string',
          required: false
        }
      },
      default: {
        email_address_: { '@path': '$.traits.email' },
        riid_: { '@path': '$.userId' }
      }
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data);

    validateListMemberPayload(data.payload)

    return sendCustomTraits(request, [data.payload], data.settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data);

    validateListMemberPayload(data.payload)

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
