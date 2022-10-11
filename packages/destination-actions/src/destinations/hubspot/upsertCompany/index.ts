import { ActionDefinition, HTTPError, RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { hubSpotBaseURL } from '../properties'

enum CompanySearchFilterOperator {
  EQ = 'EQ',
  NEQ = 'NEQ',
  LT = 'LT',
  LTE = 'LTE',
  GT = 'GT',
  GTE = 'GTE',
  BETWEEN = 'BETWEEN',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  HAS_PROPERTY = 'HAS_PROPERTY',
  NOT_HAS_PROPERTY = 'NOT_HAS_PROPERTY',
  CONTAINS_TOKEN = 'CONTAINS_TOKEN',
  NOT_CONTAINS_TOKEN = 'NOT_CONTAINS_TOKEN'
}

interface CompanySearchFilter {
  propertyName: string
  operator: CompanySearchFilterOperator
  value: unknown
}

interface companySearchFilterGroup {
  filters: CompanySearchFilter[]
}

interface CompanySearchPayload {
  filterGroups: companySearchFilterGroup[]
  properties?: string[]
  sorts?: string[]
  limit?: number
  after?: number
}

interface CompanyInfo {
  id: string
  properties: Record<string, string>
}

interface SearchCompanyResponse {
  total: number
  results: CompanyInfo[]
}

interface UpsertCompanyResponse extends CompanyInfo {}

interface CompanyContactAssociationResponse extends CompanyInfo {
  associations: {
    contacts?: {
      results: Record<string, unknown>[]
    }
  }
}

// Association identifier for HubSpot
const ASSOCIATION_TYPE = 'company_to_contact'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Company',
  description: 'Create or update a company in HubSpot.',
  fields: {
    groupid: {
      label: 'Group ID',
      description: 'Used for constructing the unique segment_group_id for HubSpot.',
      type: 'hidden',
      default: {
        '@if': {
          exists: { '@path': '$.groupId' },
          then: { '@path': '$.groupId' },
          else: { '@path': '$.context.groupId' }
        }
      }
    },
    companysearchfields: {
      label: 'Company Search Fields',
      description:
        'The unique field(s) used to search for an existing company in HubSpot to update. By default, Segment creates a custom property to store groupId for each company and uses this property to search for companies. If a company is not found, the fields provided here are then used to search. If a company is still not found, a new one is created.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    name: {
      label: 'Company Name',
      description: 'The name of the company.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.traits.name'
      }
    },
    description: {
      label: 'Company Description',
      description: 'A short statement about the company’s mission and goals.',
      type: 'string',
      default: {
        '@path': '$.traits.description'
      }
    },
    createdate: {
      label: 'Company Create Date',
      description: 'The date the company was added to your account.',
      type: 'string',
      default: {
        '@path': '$.traits.cteatedAt'
      }
    },
    streetaddress: {
      label: 'Street Address',
      description: 'The street address of the company.',
      type: 'string',
      default: {
        '@path': '$.traits.address.street'
      }
    },
    city: {
      label: 'City',
      description: 'The city where the company is located.',
      type: 'string',
      default: {
        '@path': '$.traits.address.city'
      }
    },
    state: {
      label: 'State',
      description: 'The state or region where the company is located.',
      type: 'string',
      default: {
        '@path': '$.traits.address.state'
      }
    },
    postalcode: {
      label: 'Postal Code',
      description: 'The postal or zip code of the company.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postalCode' },
          then: { '@path': '$.traits.address.postalCode' },
          else: { '@path': '$.traits.address.postal_code' }
        }
      }
    },
    domain: {
      label: 'Domain',
      description: 'The company’s website domain.',
      type: 'string',
      default: {
        '@path': '$.traits.website'
      }
    },
    phone: {
      label: 'Phone',
      description: 'The company’s primary phone number.',
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    numberofemployees: {
      label: 'Number of Employees',
      description: 'The total number of people who work for the company.',
      type: 'integer',
      default: {
        '@path': '$.traits.employees'
      }
    },
    industry: {
      label: 'Industry',
      description: 'The type of business the company performs.',
      type: 'string',
      default: {
        '@path': '$.traits.industry'
      }
    },
    lifecyclestage: {
      label: 'Lifecycle Stage',
      description:
        'The company’s stage within the marketing/sales process. See more information on default and custom stages in [HubSpot’s documentation](https://knowledge.hubspot.com/contacts/use-lifecycle-stages). Segment supports moving status forwards or backwards.',
      type: 'string'
    },
    properties: {
      label: 'Other Properties',
      description:
        'Any other default or custom company properties. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    }
  },
  perform: async (request, { payload, transactionContext }) => {
    /**
     * Upsert Company action works as follows:
     * 1. Check if you have contact_id is available in transactionContext. If not throw error
     * 2. Search by record identifiers
     * 3. If a record
     *   a. exists
     *     i.  Try to update the record
     *     ii. If it fails due to custom property error, create custom property and update
     *   b. doesn’t exist
     *     i.  Try to create company
     *     ii. If it fails due to custom property error, create custom property and create company
     * 4. Associate company with contact
     * For all other errors in the flow, throw the error as is.
     */

    // Check if transactionContext is defined and contact_id is present in TransactionContext
    if (!transactionContext || !transactionContext?.transaction?.contact_id) {
      throw new Error(
        'Identify (Upsert Contact) must be called before Group (Upsert Company) for the HubSpot Cloud (Actions) destination.'
      )
    }

    // Add groupId to company search fields
    const companySearchFields = {
      ...payload.companysearchfields,
      segment_group_id: payload.groupid
    }

    // Search for company by record identifiers
    const companySearchResponse = await searchCompany(request, companySearchFields)

    // Construct company properties if search operation didn't throw an error
    const companyProperties = {
      name: payload.name,
      description: payload.description,
      createdate: payload.createdate,
      streetaddress: payload.streetaddress,
      city: payload.city,
      state: payload.state,
      postalcode: payload.postalcode,
      domain: payload.domain,
      phone: payload.phone,
      numberofemployees: payload.numberofemployees,
      industry: payload.industry,
      lifecyclestage: payload.lifecyclestage?.toLocaleLowerCase(),
      segment_group_id: payload.groupid
    }

    // A variable to store Company ID outside the scope of the following if-else block
    // This would later be used to associate company with contact
    let companyId: string

    // Check if any companies were found based on search criteria
    if (companySearchResponse.data.total === 0) {
      // No existing company found with search criteria, attempt to create a company

      // A variable to store custom property error if any
      let createCompanyResponse: ModifiedResponse<UpsertCompanyResponse>

      try {
        createCompanyResponse = await createCompany(request, companyProperties)
        companyId = createCompanyResponse.data.id
      } catch (e) {
        if (e instanceof HTTPError && e.response.status === 400) {
          // If creation fails due to 'segment_group_id' custom property error,
          // attempt to create the custom property and retry
          await createCompanyProperty(request)
          createCompanyResponse = await createCompany(request, companyProperties)
          companyId = createCompanyResponse.data.id
        } else {
          throw e
        }
      }
    } else {
      // Existing company found, update the company, attempt to update the company
      companyId = companySearchResponse.data.results[0].id

      try {
        await updateCompany(request, companyId, companyProperties)
      } catch (e) {
        if (e instanceof HTTPError && e.response.status === 400) {
          // If update fails due to 'segment_group_id' custom property error,
          // attempt to create the custom property and retry
          await createCompanyProperty(request)
          await updateCompany(request, companyId, companyProperties)
        } else {
          throw e
        }
      }
    }

    // If upsert company is successful, associate company with contact
    await associateCompanyToContact(request, transactionContext.transaction.contact_id, companyId, ASSOCIATION_TYPE)
  }
}

// Searches for a company by record identifiers
function searchCompany(request: RequestClient, companySearchFields: { [key: string]: unknown }) {
  // Generate company search payload
  const responseProperties: string[] = ['name', 'domain', 'lifecyclestage', 'segment_group_id']
  const responseSortBy: string[] = ['name']

  const companySearchPayload: CompanySearchPayload = {
    filterGroups: [],
    properties: [...responseProperties],
    sorts: [...responseSortBy]
  }

  for (const [key, value] of Object.entries(companySearchFields)) {
    companySearchPayload.filterGroups.push({
      filters: [
        {
          propertyName: key,
          operator: CompanySearchFilterOperator.EQ,
          value
        }
      ]
    })
  }

  return request<SearchCompanyResponse>(`${hubSpotBaseURL}/crm/v3/objects/companies/search`, {
    method: 'POST',
    json: {
      ...companySearchPayload
    }
  })
}

// Creates a Company CRM object in HubSPot
function createCompany(request: RequestClient, properties: { [key: string]: unknown }) {
  return request<UpsertCompanyResponse>(`${hubSpotBaseURL}/crm/v3/objects/companies`, {
    method: 'POST',
    json: {
      properties: {
        ...properties
      }
    }
  })
}

// Updates a Company CRM object in HubSPot identified by companyId
function updateCompany(request: RequestClient, companyId: string, properties: { [key: string]: unknown }) {
  return request<UpsertCompanyResponse>(`${hubSpotBaseURL}/crm/v3/objects/companies/${companyId}`, {
    method: 'PATCH',
    json: {
      properties: {
        ...properties
      }
    }
  })
}

// Adds segment_group_id as a custom property to COmpanies CRM Object
function createCompanyProperty(request: RequestClient) {
  const segmentGroupIDProperty = {
    name: 'segment_group_id',
    label: 'Segment Group ID',
    description: 'Unique Property to map Segment Group ID with a HubSpot Company Object',
    groupName: 'companyinformation',
    type: 'string',
    fieldType: 'text',
    hidden: true,
    displayOrder: -1,
    hasUniqueValue: true,
    formField: false
  }

  return request<UpsertCompanyResponse>(`${hubSpotBaseURL}/crm/v3/properties/companies`, {
    method: 'POST',
    throwHttpErrors: false,
    json: {
      ...segmentGroupIDProperty
    }
  })
}

// Associates a Company CRM object with a Contact CRM object
function associateCompanyToContact(
  request: RequestClient,
  companyId: string,
  contactId: string,
  associationType: string
) {
  return request<CompanyContactAssociationResponse>(
    `${hubSpotBaseURL}/crm/v3/objects/companies/${companyId}/associations/contacts/${contactId}/${associationType}`,
    {
      method: 'PUT'
    }
  )
}

export default action
