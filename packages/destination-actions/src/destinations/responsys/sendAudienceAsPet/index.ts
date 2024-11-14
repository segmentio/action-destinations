import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateListMemberPayload } from '../utils'
import { createPet, petExists, updateProfileListAndPet } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Audience as Pet',
  description: 'Send Engage Audience to a separate, newly created Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    userData: {
      label: 'Recipient Data',
      description: 'Record data that represents field names and corresponding values for each profile.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: false,
      properties: {
        EMAIL_ADDRESS_: {
          label: 'Email address',
          description: "The user's email address.",
          type: 'string',
          format: 'email',
          required: false
        },
        CUSTOMER_ID_: {
          label: 'Customer ID',
          description: 'Responsys Customer ID.',
          type: 'string',
          required: false
        },
        RIID_: {
          label: 'Recipient ID',
          description: 'Recipient ID (RIID). RIID is required if Email Address is empty.',
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        CUSTOMER_ID_: { '@path': '$.userId' }
      }
    },
    folder_name: {
      label: 'Folder Name',
      description: 'The name of the folder where the new Profile Extension Table will be created.',
      type: 'string',
      required: true,
      default: 'Segment'
    },
    pet_name: {
      label: 'Profile Extension Table Name',
      description: 'The PET (Profile Extension Table) name. The default value is the audience key in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    computation_key: {
      label: 'Segment Audience Key',
      description: 'A unique identifier assigned to a specific audience in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Hidden field used to access traits or properties objects from Engage payloads.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: false,
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
  // https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-listextensions-petname-members-post.html
  perform: async (request, data) => {
    const { payload, settings } = data
    validateListMemberPayload(payload.userData)

    const petAlreadyExists = await petExists(request, settings, payload.pet_name)
    if (!petAlreadyExists) {
      await createPet(request, settings, payload)
    }

    return await updateProfileListAndPet(request, settings, [payload])
  },
  // https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-listextensions-petname-members-post.html
  performBatch: async (request, data) => {
    const { payload, settings } = data

    const validPayloads = []
    for (const item of payload) {
      try {
        validateListMemberPayload(item.userData)
        validPayloads.push(item)
      } catch (error) {
        console.error(error)
      }
    }

    // Can we consider that each batch has only one audience key?
    const petAlreadyExists = await petExists(request, settings, payload[0].pet_name)
    if (!petAlreadyExists) {
      await createPet(request, settings, payload[0])
    }

    return await updateProfileListAndPet(request, settings, payload)
  }
}

export default action
