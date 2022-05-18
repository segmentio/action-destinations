import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import QualtricsApiClient from '../qualtricsApiClient'
import { generateRandomId, parsedEmbeddedData, parsedTransactionDate } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create contact transaction',
  description: 'Create a contact transaction.',
  defaultSubscription: 'type = "track", event = "transaction"',
  fields: {
    directoryId: {
      label: 'Directory ID',
      type: 'string',
      dynamic: true,
      description: 'Directory id. Also known as the Pool ID. POOL_XXX',
      required: true,
      default: {
        '@path': '$.traits.directoryId'
      }
    },
    mailingListId: {
      label: 'Mailing list ID',
      type: 'string',
      dynamic: true,
      description: 'ID of the mailing list the contact belongs too',
      required: true,
      default: {
        '@path': '$.traits.qualtricsMailingListId'
      }
    },
    contactId: {
      label: 'Contact ID',
      type: 'string',
      description:
        'The id of the contact to add the transaction. if this field is not supplied, you must supply an extRef, email and/or phone so a look can be performed',
      default: {
        '@path': '$.traits.qualtricsContactId'
      }
    },
    extRef: {
      label: 'External Data Reference',
      type: 'string',
      allowNull: true,
      description: 'The external data reference which is a unique identifier for the user',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email of contact',
      allowNull: true,
      default: {
        '@if': {
          exists: { '@path': '$.email' },
          then: { '@path': '$.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone number',
      type: 'string',
      description: 'Phone number of contact',
      allowNull: true,
      default: {
        '@path': '$.traits.phone'
      }
    },
    transactionDate: {
      label: 'Date & time of transaction',
      type: 'datetime',
      description: 'Date and time of when the transaction occurred.',
      default: {
        '@path': '$.timestamp'
      }
    },
    transactionData: {
      label: 'Transaction data',
      type: 'object',
      description: 'Properties of the transaction too add to the users record',
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (request, data) => {
    let contactId = data.payload.contactId
    const apiClient = new QualtricsApiClient(data.settings.datacenter, data.settings.apiToken, request)
    if (!contactId) {
      const contacts = await apiClient.searchDirectoryForContact(data.payload.directoryId, {
        email: data.payload.email ? data.payload.email : undefined,
        extRef: data.payload.extRef ? data.payload.extRef : undefined,
        phone: data.payload.phone ? data.payload.phone : undefined
      })
      if (contacts.length !== 1) {
        throw new IntegrationError(
          'Unable to located one and only one contact in directory search',
          'directory_lookup_error',
          400
        )
      }
      contactId = contacts[0].id
    }
    const parsedData = parsedEmbeddedData(data.payload?.transactionData)
    const transactionDate = parsedTransactionDate(data.payload?.transactionDate)
    const payload = {
      [generateRandomId(16)]: {
        contactId,
        mailingListId: data.payload.mailingListId,
        data: parsedData,
        transactionDate
      }
    }
    return apiClient.createContactTransaction(data.payload.directoryId, payload)
  }
}

export default action
