import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { sendCustomTraits, getUserDataFieldNames, validate } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Audience',
  description: 'Send Engage Audience to a Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    userData: {
      label: 'Recepient Data',
      description: '<TODO>>',
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
      description: "The Segment Audience Key <TODO>",
      type: 'string',
      required: true,
      default: {'@path': '$.context.personas.computation_key'}
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Hidden field used to access traits or properties objects from Engage payloads.',
      type: 'object',
      required: false,
      unsafe_hidden: true, 
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    computation_class: {
      label: 'Segment Audience Computation Class',
      description: "Hidden field used to verify that the payload is generated by an Audience. Payloads not containing computation_class = 'audience' will be dropped before the perform() fuction call.",
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: {'@path': '$.context.personas.computation_class'},
      choices: [
        {label: 'Audience', value: 'audience'
      }]
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, data) => {
    const userDataFieldNames: string[] = getUserDataFieldNames(data as unknown as Data);

    validate(data.settings)

    return sendCustomTraits(request, [data.payload], data.settings, userDataFieldNames, true)
  },

  performBatch: async (request, data) => {
    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data);

    validate(data.settings)

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames, true)
  }
}

export default action
