import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import QualtricsApiClient, {
  CreateDirectoryContactRequest,
  CreateDirectoryContactResponse,
  SearchDirectoryContactResponse
} from '../qualtricsApiClient'
import { generateRandomId, parsedEmbeddedData, parsedTransactionDate } from '../utils'
import type { Payload } from './generated-types'

async function searchOrCreateContact(payload: Payload, apiClient: QualtricsApiClient): Promise<string> {
  const contacts = await searchContact(payload, apiClient)
  if (contacts.length === 0) {
    const contact = await createContact(payload, apiClient)
    return contact.id
  } else if (contacts.length !== 1) {
    throw new IntegrationError(
      'Unable to located one and only one contact in directory search',
      'directory_lookup_error',
      400
    )
  } else {
    return contacts[0].id
  }
}

async function searchContact(
  payload: Payload,
  apiClient: QualtricsApiClient
): Promise<SearchDirectoryContactResponse[]> {
  if (!payload.email && !payload.extRef && !payload.phone) {
    throw new IntegrationError(
      'Unable to lookup contact. At least 1 field is required: contactId, extRef, email or phone',
      'directory_lookup_error',
      400
    )
  }
  return await apiClient.searchDirectoryForContact(payload.directoryId, {
    email: payload?.email,
    extRef: payload?.extRef,
    phone: payload?.phone
  })
}
async function createContact(payload: Payload, apiClient: QualtricsApiClient): Promise<CreateDirectoryContactResponse> {
  const requestPayload: CreateDirectoryContactRequest = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    email: payload.email,
    extRef: payload.extRef,
    unsubscribed: payload.unsubscribed,
    language: payload.language,
    embeddedData: payload.embeddedData
  }
  return await apiClient.createDirectoryContact(payload.directoryId, requestPayload)
}

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
      contactId = await searchOrCreateContact(data.payload, apiClient)
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
