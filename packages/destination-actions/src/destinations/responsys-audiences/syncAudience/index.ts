import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateListMemberPayload } from '../functions'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import { updateProfileListAndPet } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description:
    'Sync the Audience, merging profiles with the configured Profile List, and updating the subscription status in the configure PET (Profile Extension Table).',
  fields: {
    recipientData: {
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
          description:
            'Recipient ID (RIID). RIID is required if Email Address and Customer ID are empty. Only use it if the corresponding profile already exists in Responsys.',
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
    default_permission_status: {
      label: 'Default Permission Status',
      description:
        'This value must be specified as either OPTIN or OPTOUT. It defaults to the value defined in this destination settings.',
      type: 'string',
      required: false,
      choices: [
        { label: 'Opt In', value: 'OPTIN' },
        { label: 'Opt Out', value: 'OPTOUT' }
      ]
    }
  },
  perform: async (request, data) => {
    const { payload, settings, auth } = data

    validateListMemberPayload(payload.recipientData)
    return await updateProfileListAndPet(request, auth as AuthTokens, settings, [payload])
  },
  performBatch: async (request, data) => {
    const { payload, settings, auth } = data

    const validPayloads = []
    for (const item of payload) {
      try {
        validateListMemberPayload(item.recipientData)
        validPayloads.push(item)
      } catch (error) {
        console.error(error)
      }
    }

    return await updateProfileListAndPet(request, auth as AuthTokens, settings, validPayloads)
  }
}

export default action
