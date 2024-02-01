import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { sendCustomTraits } from '../utils'

interface Data {
  rawMapping: {
    userData: {
      [k: string]: unknown
    }
  }
}

const validateUserDataFieldNames = (userDataFieldNames: string[]): void => {
  const badlyNamedFields = userDataFieldNames.filter((str) => !str.endsWith('_'))

  if (badlyNamedFields.length > 0) {
    throw new IntegrationError(
      `Recipient Data property names must end with _ symbol. ${badlyNamedFields.join(', ')}`,
      'RECIPIENT_DATA_PROPERTY_VALIDATION_ERROR',
      400
    )
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Custom Traits to Profile Extension Table',
  description: 'Sync Custom Traits to Profile Extension Table Records in Responsys',
  defaultSubscription: 'type = "identify"',
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
        EMAIL_ADDRESS_: { '@path': '$.traits.email' },
        CUSTOMER_ID_: { '@path': '$.userId' }
      }
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, data) => {
    const userDataFieldNames: string[] = Object.keys((data as unknown as Data).rawMapping.userData)

    validateUserDataFieldNames(userDataFieldNames)

    return sendCustomTraits(request, [data.payload], data.settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const userDataFieldNames: string[] = Object.keys((data as unknown as Data).rawMapping.userData)

    validateUserDataFieldNames(userDataFieldNames)

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames)
  }
}

export default action
