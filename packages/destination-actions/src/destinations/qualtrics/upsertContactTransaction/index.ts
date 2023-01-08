import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import QualtricsApiClient, { CreateDirectoryContactRequest } from '../qualtricsApiClient'
import { generateRandomId, parsedEmbeddedData, parsedTransactionDate } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert contact transaction',
  description: 'Upsert a contact transaction.',
  defaultSubscription: 'type = "track", event = "transaction"',
  fields: {
    directoryId: {
      label: 'Directory ID',
      type: 'string',
      description: 'Directory id. Also known as the Pool ID. POOL_XXX',
      required: true,
      default: {
        '@path': '$.traits.directoryId'
      }
    },
    mailingListId: {
      label: 'Mailing list ID',
      type: 'string',
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
        'The id of the contact to add the transaction. if this field is not supplied, you must supply an extRef, email and/or phone so a look can be performed. If the lookup does not find a contact, one will be created with these fields and including the optionally supplied firstName, lastName, language, subscribed and embeddedData',
      default: {
        '@path': '$.traits.qualtricsContactId'
      }
    },
    extRef: {
      label: 'External Data Reference',
      type: 'string',
      description: 'The external data reference which is a unique identifier for the user',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.extRef' },
          then: { '@path': '$.traits.extRef' },
          else: { '@path': '$.userId' }
        }
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email of contact',
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
      default: {
        '@path': '$.traits.phone'
      }
    },
    firstName: {
      label: 'First name',
      type: 'string',
      description: 'First name of contact',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    lastName: {
      label: 'Last name',
      type: 'string',
      description: 'Last name of contact',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'Language code of the contact',
      default: {
        '@if': {
          exists: { '@path': '$.traits.language' },
          then: { '@path': '$.traits.language' },
          else: 'EN'
        }
      }
    },
    unsubscribed: {
      label: 'Contact is unsubscribed',
      type: 'boolean',
      description: 'Should the contact be unsubscribed from correspondence',
      default: false
    },
    embeddedData: {
      label: 'Contact embedded data',
      type: 'object',
      description: 'Contact embedded data (properties of the contact)',
      defaultObjectUI: 'keyvalue'
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
      if (!data.payload.email && !data.payload.extRef && !data.payload.phone) {
        throw new IntegrationError(
          'Unable to lookup contact. At least 1 field is required: contactId, extRef, email or phone',
          'directory_lookup_error',
          400
        )
      }
      const contacts = await apiClient.searchDirectoryForContact(data.payload.directoryId, {
        email: data.payload.email ? data.payload.email : undefined,
        extRef: data.payload.extRef ? data.payload.extRef : undefined,
        phone: data.payload.phone ? data.payload.phone : undefined
      })
      if (contacts.length === 0) {
        const payload: CreateDirectoryContactRequest = {
          firstName: data.payload.firstName,
          lastName: data.payload.lastName,
          phone: data.payload.phone,
          email: data.payload.email,
          extRef: data.payload.extRef,
          unsubscribed: data.payload.unsubscribed,
          language: data.payload.language,
          embeddedData: data.payload.embeddedData
        }
        const contact = await apiClient.createDirectoryContact(data.payload.directoryId, payload)
        contactId = contact.id
      } else if (contacts.length !== 1) {
        throw new IntegrationError(
          'Unable to located one and only one contact in directory search',
          'directory_lookup_error',
          400
        )
      } else {
        contactId = contacts[0].id
      }
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
