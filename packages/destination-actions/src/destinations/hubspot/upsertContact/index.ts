import {
  ActionDefinition,
  RequestClient,
  IntegrationError,
  DynamicFieldResponse,
  HTTPError,
  ModifiedResponse
} from '@segment/actions-core'
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
  properties: Record<string, string | null>
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

export interface ModifiedResponseWithOptions<T, JSONType extends object = object> extends ModifiedResponse<T> {
  options: {
    body: string
    json: JSONType
  }
}

export interface ContactBatchResponse {
  status: string
  results: ContactSuccessResponse[]
  numErrors?: number
  errors?: ContactErrorResponse[]
  options: {
    body: string
    [key: string]: unknown
  }
}

export interface BatchContactResponse {
  data: ContactBatchResponse
  options: {
    body: string
    [key: string]: unknown
  }
}

interface ContactsUpsertMapItem {
  id?: string
  properties: ContactProperties
}
interface ContactField {
  label: string
  name: string
  hasUniqueValue: boolean
}

interface ContactsFieldsResponse {
  data: {
    results: ContactField[]
  }
  // Add other properties as needed
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a contact in HubSpot.',
  defaultSubscription: 'type = "identify"',
  fields: {
    /* 
      Ideally the email field shouldn't be named email as it allows for any identify value to be provided. 
      The ability to provide Hubspot with any identifier type was added after this field was defined.
      It was decided that the email field would remain in place, rather than needing to run a DB migration  
    */
    email: {
      label: 'Identifier Value',
      type: 'string',
      description:
        "An Identifier for the Contact. This can be the Contact's email address or the value of any other unique Contact property. If an existing Contact is found, Segment will update the Contact. If a Contact is not found, Segment will create a new Contact.",
      required: true,
      default: {
        '@path': '$.traits.email'
      }
    },
    identifier_type: {
      label: 'Identifier Type',
      type: 'string',
      description:
        'The type of identifier used to uniquely identify the Contact. This defaults to email, but can be set to be any unique Contact property.',
      dynamic: true,
      required: false,
      default: 'email'
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
    },
    enable_batching: {
      type: 'boolean',
      label: 'Send Batch Data to HubSpot',
      description:
        'If true, Segment will batch events before sending to HubSpot’s API endpoint. HubSpot accepts batches of up to 100 events. Note: Contacts created with batch endpoint can’t be associated to a Company from the UpsertCompany Action.',
      default: false
    }
  },
  dynamicFields: {
    identifier_type: async (request) => {
      return getContactIdentifierTypes(request)
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
      [(payload.identifier_type as string) ?? 'email']: payload.email,
      website: payload.website,
      lifecyclestage: payload.lifecyclestage?.toLowerCase(),
      ...flattenObject(payload.properties)
    } as ContactProperties

    // An attempt is made to update contact with given properties. If HubSpot returns 404 indicating
    // the contact is not found, an attempt will be made to create contact with the given properties
    try {
      const response = await updateContact(request, payload, contactProperties)

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
        await updateContact(request, payload, { lifecyclestage: '' })
        // update contact again with new lifecycle stage
        return updateContact(request, payload, contactProperties)
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
    // const p1 = {...p, email: 'main_email_1@gmail.com', lifecyclestage:'lead'}
    // const p2 = {...p, email: 'blahblah_oh_no', identifier_type: 'external_id_type_1', lifecyclestage:'Opportunity'}
    // const p3 = {...p, email: 'monkeyman@example.org', lifecyclestage:'lead'}
    // const payload = [p1,p2,p3]

    const payloadsByIdTypes: Map<string, ContactsUpsertMapItem[]> = chunkPayloadsByIdType(payload)
    const readResponses: ModifiedResponse<ContactBatchResponse>[] = await getCanonicalIdentifiers(
      request,
      payloadsByIdTypes
    )
    const { createList, updateList } = buildUpsertPayloadLists(readResponses, payloadsByIdTypes)
    // Create contacts that don't exist in HubSpot
    if (createList.length > 0) {
      await createContactsBatch(request, createList)
    }

    if (updateList.length > 0) {
      // Update contacts that already exist in HubSpot
      const updateContactResponse = await updateContactsBatch(request, updateList)

      // Check if Life Cycle Stage update was successful, and pick the ones that didn't succeed
      await checkAndRetryUpdatingLifecycleStage(request, updateContactResponse)
    }
  }
}

function buildUpsertPayloadLists(
  readResponses: ModifiedResponse<ContactBatchResponse>[],
  payloadsByIdTypes: Map<string, ContactsUpsertMapItem[]>
): { createList: ContactCreateRequestPayload[]; updateList: ContactUpdateRequestPayload[] } {
  const createList: ContactCreateRequestPayload[] = []
  const updateList: ContactUpdateRequestPayload[] = []

  readResponses.forEach((response) => {
    const identifierType = (response as ModifiedResponseWithOptions<ContactBatchResponse, { idProperty: string }>)
      .options.json.idProperty
    console.log(JSON.stringify(response, null, 2))
    const results = response.data.results ?? []
    const errors = response.data.errors ?? []
    const payloadsByIdType = payloadsByIdTypes.get(identifierType)

    // Iterate through Contacts which were found in Hubspot. These will be updated.
    results.forEach((result) => {
      const contactsUpsertMapItem: ContactsUpsertMapItem | undefined = payloadsByIdType?.find((payload) => {
        return payload.id == result.properties[identifierType]
      })
      if (contactsUpsertMapItem) {
        delete contactsUpsertMapItem.properties['email']
        updateList.push({
          id: result.id,
          properties: contactsUpsertMapItem.properties
        })
      } else {
        throw new IntegrationError(
          `Problem with Contact search respond data from Hubspot for Contact with identifier ${result.id} of type ${identifierType}.`,
          'HUBSPOT_DATA_MISMATCH',
          400
        )
      }
    })

    // Iterate through Contacts which were not found in Hubspot. These will be created.
    errors.forEach((error) => {
      if (error.category === 'OBJECT_NOT_FOUND' && error.status === 'error') {
        error.context.ids.forEach((id) => {
          const contactsUpsertMapItem: ContactsUpsertMapItem | undefined = payloadsByIdType?.find((payload) => {
            return payload.id == id
          })
          if (contactsUpsertMapItem) {
            createList.push({
              properties: contactsUpsertMapItem.properties
            })
          } else {
            throw new IntegrationError(
              `Problem with Contact search respond data from Hubspot for Contact with identifier ${id} of type ${identifierType}.`,
              'HUBSPOT_DATA_MISMATCH',
              400
            )
          }
        })
      } else {
        throw new IntegrationError(error.message, error.category, 400)
      }
    })
  })

  return { createList, updateList }
}

async function getCanonicalIdentifiers(
  request: RequestClient,
  payloadsByIdTypes: Map<string, ContactsUpsertMapItem[]>
): Promise<ModifiedResponse<ContactBatchResponse>[]> {
  const requests: Promise<ModifiedResponse<ContactBatchResponse>>[] = []

  payloadsByIdTypes.forEach((contactsUpsertMapItem, identifierType) => {
    requests.push(
      readContactsBatch(
        request,
        contactsUpsertMapItem.map((payload) => payload.id as string),
        identifierType
      )
    )
  })

  const responses: ModifiedResponse<ContactBatchResponse>[] = await Promise.all(requests)

  return responses
}

function chunkPayloadsByIdType(payloads: Payload[]): Map<string, ContactsUpsertMapItem[]> {
  const payloadsByIdTypes: Map<string, ContactsUpsertMapItem[]> = new Map()

  payloads.map((payload) => {
    const {
      company,
      firstname,
      lastname,
      phone,
      address,
      city,
      state,
      country,
      zip,
      email,
      website,
      identifier_type,
      lifecyclestage,
      properties
    } = payload
    const identifierType = identifier_type ?? 'email'
    const contactsUpsertMapItem = {
      // p.email is used as the identifier value. It may not be an email address if the user selects a different identifier type
      id: identifierType == 'email' ? email.toLowerCase() : email,
      properties: {
        company,
        firstname,
        lastname,
        phone,
        address,
        city,
        state,
        country,
        zip,
        [identifierType]: email ?? undefined,
        website,
        lifecyclestage: lifecyclestage?.toLowerCase() ?? undefined,
        ...flattenObject(properties)
      } as ContactProperties
    } as ContactsUpsertMapItem

    const items = payloadsByIdTypes.get(identifierType)

    if (items) {
      items.push(contactsUpsertMapItem)
    } else {
      payloadsByIdTypes.set(identifierType, [contactsUpsertMapItem])
    }
  })

  return payloadsByIdTypes
}

async function getContactIdentifierTypes(request: RequestClient): Promise<DynamicFieldResponse> {
  const contactFields: ContactsFieldsResponse = await request(`${HUBSPOT_BASE_URL}/crm/v3/properties/contacts`, {
    method: 'GET',
    skipResponseCloning: true
  })

  return {
    choices: [
      {
        label: 'Email',
        value: 'email'
      },
      // hs_unique_creation_key is a unique identifier that is automatically generated by HubSpot. It is readonly so should not be included in the dynamic list
      ...contactFields.data.results
        .filter((field: ContactField) => field.hasUniqueValue && field.name != 'hs_unique_creation_key')
        .map((field: ContactField) => {
          return {
            label: field.label,
            value: field.name
          }
        })
    ]
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

async function updateContact(request: RequestClient, payload: Payload, properties: ContactProperties) {
  const { email: identifierValue, identifier_type } = payload
  return request<ContactSuccessResponse>(
    `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${identifierValue}?idProperty=${identifier_type}`,
    {
      method: 'PATCH',
      json: {
        properties: properties
      }
    }
  )
}

async function readContactsBatch(
  request: RequestClient,
  identifiers: string[],
  identifierType: string
): Promise<ModifiedResponse<ContactBatchResponse>> {
  const requestPayload = {
    // ensure we request email and any other identifier type property
    properties: [...new Set([...['email', 'lifecyclestage'], ...[identifierType]])],
    idProperty: identifierType,
    inputs: identifiers.map((identifier) => ({
      id: identifier
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

async function checkAndRetryUpdatingLifecycleStage(
  request: RequestClient,
  updateContactResponse: ModifiedResponse<ContactBatchResponse>
): Promise<void> {
  const results = updateContactResponse.data.results
  const requests: ContactUpdateRequestPayload[] = JSON.parse(
    (updateContactResponse as ModifiedResponseWithOptions<ContactBatchResponse>).options.body
  ).inputs

  const differences: { id: string; properties: { lifecyclestage: string } }[] = []
  const differences_reset: { id: string; properties: { lifecyclestage: string } }[] = []

  results.forEach((result) => {
    // Find corresponding item in the second array
    const request = requests.find((req) => req.id === result.id)
    if (request) {
      // Compare lifecyclestage properties
      if (!Object.is(result.properties.lifecyclestage, request.properties.lifecyclestage)) {
        differences_reset.push({
          id: request.id,
          properties: {
            lifecyclestage: ''
          }
        })
        differences.push({
          id: request.id,
          properties: {
            lifecyclestage: request.properties.lifecyclestage as string
          }
        })
      }
    }
  })

  if (differences.length > 0) {
    // Reset Life Cycle Stage
    await updateContactsBatch(request, differences_reset as ContactUpdateRequestPayload[])

    // Set the new Life Cycle Stage
    await updateContactsBatch(request, differences as ContactUpdateRequestPayload[])
  }
}

export default action
