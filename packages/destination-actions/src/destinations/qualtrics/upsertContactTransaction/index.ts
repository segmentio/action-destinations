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
import { getDirectoryIds } from '../dynamicFields'

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
      'Unable to lookup contact. At least 1 field is required: contactId, external data reference, email or phone',
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
  description:
    'Add a transaction to a contact in Qualtrics directory. If the contact already exists, add the transaction. If the contact does not exist, create the contact first, then add the transaction record.',
  defaultSubscription: 'type = "track", event = "Transaction Created"',
  fields: {
    directoryId: {
      label: 'Directory ID',
      type: 'string',
      description: 'Directory id. Also known as the Pool ID. POOL_XXX',
      required: true,
      dynamic: true
    },
    mailingListId: {
      label: 'Mailing list ID',
      type: 'string',
      description:
        'ID of the mailing list the contact belongs too. If not part of the event payload, create / use an existing mailing list from Qualtrics. Will have the form CG_xxx',
      required: true,
      default: {
        '@path': '$.traits.qualtricsMailingListId'
      }
    },
    contactId: {
      label: 'Contact ID',
      type: 'string',
      description:
        'The id of the contact to add the transaction. if this field is not supplied, you must supply an external data reference, email and/or phone so a look can be performed. If the lookup does not find a contact, one will be created with these fields and including the optionally supplied firstName, lastName, language, subscribed and embeddedData',
      default: {
        '@path': '$.traits.qualtricsContactId'
      }
    },
    extRef: {
      label: 'External Data Reference',
      type: 'string',
      description:
        'The external data reference which is a unique identifier for the user. This is only used to search for the contact and if a new contact needs to be created, it is not added to the transaction data.',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description:
        'Email of contact. This is only used to search for the contact and if a new contact needs to be created, it is not added to the transaction data.',
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
      description:
        'Phone number of contact. This is only used to search for the contact and if a new contact needs to be created, it is not added to the transaction data.',
      default: {
        '@path': '$.traits.phone'
      }
    },
    firstName: {
      label: 'First name',
      type: 'string',
      description:
        'First name of contact. This is only used if a new contact needs to be created and is not added to the transaction data.',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    lastName: {
      label: 'Last name',
      type: 'string',
      description:
        'Last name of contact. This is only used if a new contact needs to be created and is not added to the transaction data.',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    language: {
      label: 'Language',
      type: 'string',
      description:
        'Language code of the contact. This is only used if a new contact needs to be created and is not added to the transaction data.',
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
      description:
        'Should the contact be unsubscribed from correspondence. This is only used if a new contact needs to be created and is not added to the transaction.',
      default: false
    },
    embeddedData: {
      label: 'Contact embedded data',
      type: 'object',
      description:
        'Contact embedded data (properties of the contact). These are added to the contact only if a new contact needs to be created not added to the transaction.',
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
  dynamicFields: {
    directoryId: getDirectoryIds
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
