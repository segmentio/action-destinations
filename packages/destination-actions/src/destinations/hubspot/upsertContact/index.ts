import { HTTPError } from '@segment/actions-core'
import { ActionDefinition, RequestClient, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { flattenObject } from '../utils'

interface ContactProperties {
  company?: string | undefined
  firstname?: string | undefined
  lastname?: string | undefined
  phone?: string | undefined
  address?: string | undefined
  city?: string | undefined
  state?: string | undefined
  country?: string | undefined
  zip?: string | undefined
  email?: string | undefined
  website?: string | undefined
  lifecyclestage?: string | undefined
  [key: string]: string | undefined
}

interface ContactCreateRequestPayload {
  properties: ContactProperties
}

interface ContactUpdateRequestPayload {
  id: string
  properties: ContactProperties
}

interface ContactSuccessResponse {
  id: string
  properties: Record<string, string>
}

interface ContactErrorResponse {
  status: string
  category: string
  message: string
  context: {
    ids: string[]
    [key: string]: unknown
  }
}

export interface ContactBatchResponse {
  status: string
  results: ContactSuccessResponse[]
  numErrors?: number
  errors?: ContactErrorResponse[]
}
export interface BatchContactResponse {
  data: ContactBatchResponse
}

interface ContactsUpsertMapItem {
  action: 'create' | 'update' | 'undefined'
  payload: {
    id?: string
    properties: ContactProperties
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a contact in HubSpot.',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      label: 'Email',
      type: 'string',
      description:
        'The contact’s email. Email is used to uniquely identify contact records in HubSpot. If an existing contact is found with this email, we will update the contact. If a contact is not found, we will create a new contact.',
      required: true,
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
    company: {
      label: 'Company Name',
      type: 'string',
      description: 'The contact’s company.',
      default: {
        '@path': '$.traits.company'
      }
    },
    firstname: {
      label: 'First Name',
      type: 'string',
      description: 'The contact’s first name.',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.traits.firstName' }
        }
      }
    },
    lastname: {
      label: 'Last Name',
      type: 'string',
      description: 'The contact’s last name.',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.traits.lastName' }
        }
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'The contact’s phone number.',
      default: {
        '@path': '$.traits.phone'
      }
    },
    address: {
      label: 'Street Address',
      type: 'string',
      description: "The contact's street address, including apartment or unit number.",
      default: {
        '@path': '$.traits.address.street'
      }
    },
    city: {
      label: 'City',
      type: 'string',
      description: "The contact's city of residence.",
      default: {
        '@path': '$.traits.address.city'
      }
    },
    state: {
      label: 'State',
      type: 'string',
      description: "The contact's state of residence.",
      default: {
        '@path': '$.traits.address.state'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      description: "The contact's country of residence.",
      default: {
        '@path': '$.traits.address.country'
      }
    },
    zip: {
      label: 'Postal Code',
      type: 'string',
      description: "The contact's zip code.",
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postalCode' },
          then: { '@path': '$.traits.address.postalCode' },
          else: { '@path': '$.traits.address.postal_code' }
        }
      }
    },
    website: {
      label: 'Website',
      type: 'string',
      description: 'The contact’s company/other website.',
      default: {
        '@path': '$.traits.website'
      }
    },
    lifecyclestage: {
      label: 'Lifecycle Stage',
      type: 'string',
      description:
        'The contact’s stage within the marketing/sales process. See more information on default and custom stages in [HubSpot’s documentation](https://knowledge.hubspot.com/contacts/use-lifecycle-stages). Segment supports moving status forwards or backwards.'
    },
    properties: {
      label: 'Other properties',
      type: 'object',
      description:
        'Any other default or custom contact properties. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: async (request, { payload, transactionContext }) => {
    const contactProperties = {
      company: payload.company,
      firstname: payload.firstname,
      lastname: payload.lastname,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      zip: payload.zip,
      email: payload.email,
      website: payload.website,
      lifecyclestage: payload.lifecyclestage?.toLowerCase(),
      ...flattenObject(payload.properties)
    }

    /**
     * An attempt is made to update contact with given properties. If HubSpot returns 404 indicating
     * the contact is not found, an attempt will be made to create contact with the given properties
     */

    try {
      const response = await updateContact(request, payload.email, contactProperties)

      // cache contact_id for it to be available for company action
      transactionContext?.setTransaction('contact_id', response.data.id)

      // HubSpot returns the updated lifecylestage(LCS) as part of the response.
      // If the stage we are trying to set is backward than the current stage, it retains the current stage
      // and updates the timestamp. For determining if reset is required or not, we can compare
      // the stage returned in response with the desired stage . If they are not the same, reset
      // and update. More details - https://knowledge.hubspot.com/contacts/use-lifecycle-stages
      if (payload.lifecyclestage) {
        const currentLCS = response.data.properties['lifecyclestage']
        const hasLCSChanged = currentLCS === payload.lifecyclestage.toLowerCase()
        if (hasLCSChanged) return response
        // reset lifecycle stage
        await updateContact(request, payload.email, { lifecyclestage: '' })
        // update contact again with new lifecycle stage
        return updateContact(request, payload.email, contactProperties)
      }
      return response
    } catch (ex) {
      if ((ex as HTTPError)?.response?.status == 404) {
        const result = await createContact(request, contactProperties)

        // cache contact_id for it to be available for company action
        transactionContext?.setTransaction('contact_id', result.data.id)
        return result
      }
      throw ex
    }
  },

  performBatch: async (request, { payload }) => {
    // Create a map of email & id to contact upsert payloads
    // Record<Email and ID, ContactsUpsertMapItem>
    let contactsUpsertMap = mapUpsertContactPayload(payload)

    // Fetch the list of contacts from HubSpot
    const readResponse = await readContactsBatch(request, Object.keys(contactsUpsertMap))
    contactsUpsertMap = updateActionsForBatchedContacts(readResponse, contactsUpsertMap)

    // Divide Contacts into two maps - one for insert and one for update
    const createList: ContactCreateRequestPayload[] = []
    const updateList: ContactUpdateRequestPayload[] = []

    for (const [_, { action, payload }] of Object.entries(contactsUpsertMap)) {
      if (action === 'create') {
        createList.push(payload)
      } else if (action === 'update') {
        updateList.push({
          id: payload.id as string,
          properties: payload.properties
        })
      }
    }

    // Create contacts that don't exist in HubSpot
    if (createList.length > 0) {
      await createContactsBatch(request, createList)
    }

    if (updateList.length > 0) {
      // Update contacts that already exist in HubSpot
      const updateContactResponse = await updateContactsBatch(request, updateList)
      // Check if Life Cycle Stage update was successful, and pick the ones that didn't succeed
      await checkAndRetryUpdatingLifecycleStage(request, updateContactResponse, contactsUpsertMap)
    }
  }
}

async function createContact(request: RequestClient, contactProperties: ContactProperties) {
  return request<ContactSuccessResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
    method: 'POST',
    json: {
      properties: contactProperties
    }
  })
}

async function updateContact(request: RequestClient, email: string, properties: ContactProperties) {
  return request<ContactSuccessResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${email}?idProperty=email`, {
    method: 'PATCH',
    json: {
      properties: properties
    }
  })
}

async function readContactsBatch(request: RequestClient, emails: string[]) {
  const requestPayload = {
    properties: ['email', 'lifecyclestage'],
    idProperty: 'email',
    inputs: emails.map((email) => ({
      id: email
    }))
  }

  return request<ContactBatchResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/read`, {
    method: 'POST',
    json: requestPayload
  })
}

async function createContactsBatch(request: RequestClient, contactCreatePayload: ContactCreateRequestPayload[]) {
  return request<ContactBatchResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/create`, {
    method: 'POST',
    json: {
      inputs: contactCreatePayload
    }
  })
}

async function updateContactsBatch(request: RequestClient, contactUpdatePayload: ContactUpdateRequestPayload[]) {
  return request<ContactBatchResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/update`, {
    method: 'POST',
    json: {
      inputs: contactUpdatePayload
    }
  })
}

function mapUpsertContactPayload(payload: Payload[]) {
  // Create a map of email & id to contact upsert payloads
  // Record<Email and ID, ContactsUpsertMapItem>
  const contactsUpsertMap: Record<string, ContactsUpsertMapItem> = {}
  for (const contact of payload) {
    contactsUpsertMap[contact.email.toLowerCase()] = {
      // Setting initial state to undefined as we don't know if the contact exists in HubSpot
      action: 'undefined',

      payload: {
        // Skip setting the id as we don't know if the contact exists in HubSpot
        properties: {
          company: contact.company,
          firstname: contact.firstname,
          lastname: contact.lastname,
          phone: contact.phone,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          zip: contact.zip,
          email: contact.email.toLowerCase(),
          website: contact.website,
          lifecyclestage: contact.lifecyclestage?.toLowerCase(),
          ...flattenObject(contact.properties)
        }
      }
    }
  }

  return contactsUpsertMap
}

function updateActionsForBatchedContacts(
  readResponse: BatchContactResponse,
  contactsUpsertMap: Record<string, ContactsUpsertMapItem>
) {
  // Case 1: Loop over results if there are any
  if (readResponse.data?.results && readResponse.data.results.length > 0) {
    for (const result of readResponse.data.results) {
      // Set the action to update for contacts that exist in HubSpot
      contactsUpsertMap[result.properties.email].action = 'update'

      // Set the id for contacts that exist in HubSpot
      contactsUpsertMap[result.properties.email].payload.id = result.id

      // Re-index the payload with ID
      contactsUpsertMap[result.id] = { ...contactsUpsertMap[result.properties.email] }
      delete contactsUpsertMap[result.properties.email]
    }
  }

  // Case 2: Loop over errors if there are any
  if (readResponse.data?.numErrors && readResponse.data.errors) {
    for (const error of readResponse.data.errors) {
      if (error.status === 'error' && error.category === 'OBJECT_NOT_FOUND') {
        // Set the action to create for contacts that don't exist in HubSpot
        for (const id of error.context.ids) {
          //Set Action to create
          contactsUpsertMap[id].action = 'create'
        }
      } else {
        // Throw any other error responses
        throw new IntegrationError(error.message, error.category, 400)
      }
    }
  }
  return contactsUpsertMap
}
async function checkAndRetryUpdatingLifecycleStage(
  request: RequestClient,
  updateContactResponse: BatchContactResponse,
  contactsUpsertMap: Record<string, ContactsUpsertMapItem>
) {
  // Check if Life Cycle Stage update was successful, and pick the ones that didn't succeed
  const resetLifeCycleStagePayload: ContactUpdateRequestPayload[] = []
  const retryLifeCycleStagePayload: ContactUpdateRequestPayload[] = []

  for (const result of updateContactResponse.data.results) {
    const desiredLifeCycleStage = contactsUpsertMap[result.id].payload.properties.lifecyclestage
    const currentLifeCycleStage = result.properties.lifecyclestage

    if (desiredLifeCycleStage && desiredLifeCycleStage !== currentLifeCycleStage) {
      resetLifeCycleStagePayload.push({
        id: result.id,
        properties: {
          lifecyclestage: ''
        }
      })

      retryLifeCycleStagePayload.push({
        id: result.id,
        properties: {
          lifecyclestage: desiredLifeCycleStage
        }
      })
    }
  }
  // Retry Life Cycle Stage Updates
  if (retryLifeCycleStagePayload.length > 0) {
    // Reset Life Cycle Stage
    await updateContactsBatch(request, resetLifeCycleStagePayload)

    // Set the new Life Cycle Stage
    await updateContactsBatch(request, retryLifeCycleStagePayload)
  }
}
export default action
