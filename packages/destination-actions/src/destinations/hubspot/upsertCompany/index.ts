import { ActionDefinition, RequestClient, ModifiedResponse, HTTPError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { hubSpotBaseURL, SEGMENT_UNIQUE_IDENTIFIER, ASSOCIATION_TYPE } from '../properties'
import {
  UpsertCompanyError,
  MissingIdentityCallThrowableError,
  CompanySearchThrowableError,
  RestrictedPropertyThrowableError,
  SegmentUniqueIdentifierMissingRetryableError,
  MultipleCompaniesInSearchResultThrowableError,
  isSegmentUniqueIdentifierPropertyError
} from '../errors'

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

interface CompanyProperty {
  name: string
  label: string
  description: string
  groupName: string
  type: string
  fieldType: string
  hidden?: boolean
  displayOrder?: number
  hasUniqueValue?: boolean
  formField?: boolean
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

/**
 * Upsert Company Action works as follows:
 * 1. Check if contact_id is available in transactionContext,
 *    if not available throw error, else continue to step 2
 * 2. Check if internal property SEGMENT_UNIQUE_IDENTIFIER is re-defined in other properties,
 *    if defined throw error, else continue to step 3
 * 3. Try to update the company using SEGMENT_UNIQUE_IDENTIFIER
 *    Case a: If a company is found, update the Company with new properties and move to step 7
 *    Case b: If company is found but SEGMENT_UNIQUE_IDENTIFIER is not defined, create the property
 *            and throw a RetryableError to Centrifuge
 *    Case c: For 404 error assume company is not found and move to Step 4
 *    Case d: If any other error occurs in the flow, throw the error
 * 4. If Company Search Fields are defined, attempt to search for a Company
 *    Case a: If company is not found, move to Step 5
 *    Case b: If a company is found, move to Step 6
 * 5. An existing company was not found, create a new company
 *    case a: If company is created, move to Step 7
 *    case b: If company is not created due to missing SEGMENT_UNIQUE_IDENTIFIER
 *            create the property and retry creation of company, move to Step 7 if it succeeds
 *    Case c: If any other error occurs in the flow, throw the error
 * 6. Existing company is found, update the company with new properties
 *    case a: If company is updated, move to Step 7
 *    case b: If company is not updated due to missing SEGMENT_UNIQUE_IDENTIFIER
 *            create the property and retry to update of company, move to Step 7 if it succeeds
 *    Case c: If any other error occurs in the flow, throw the error
 * 7. Associate company with Contact ID from transactionContext, throw error if any
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Company',
  description: 'Create or update a company in HubSpot.',
  fields: {
    groupid: {
      label: 'Group ID',
      description: `Used for constructing the unique ${SEGMENT_UNIQUE_IDENTIFIER} for HubSpot.`,
      type: 'hidden',
      required: true,
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
      // required: true,
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
        '@path': '$.traits.createdAt'
      }
    },
    address: {
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
    zip: {
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
      description: `Any other default or custom company properties. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties). Important: Please do not use ’${SEGMENT_UNIQUE_IDENTIFIER}’ here as it is an internal property and will result in an an error.`,
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    }
  },
  perform: async (request, { payload, transactionContext }) => {
    // Check if user has mapped the internal property SEGMENT_UNIQUE_IDENTIFIER in other Properties field
    if (payload.properties?.[SEGMENT_UNIQUE_IDENTIFIER]) {
      throw RestrictedPropertyThrowableError
    }

    // Check if transactionContext is defined and contact_id is present in TransactionContext
    if (!transactionContext || !transactionContext?.transaction?.contact_id) {
      throw MissingIdentityCallThrowableError
    }

    // Construct company properties
    const companyProperties = {
      name: payload.name,
      description: payload.description,
      createdate: payload.createdate,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zip: payload.zip,
      domain: payload.domain,
      phone: payload.phone,
      numberofemployees: payload.numberofemployees,
      industry: payload.industry,
      lifecyclestage: payload.lifecyclestage?.toLocaleLowerCase(),
      [SEGMENT_UNIQUE_IDENTIFIER]: payload.groupid,
      ...payload.properties
    }

    // Define SEGMENT_UNIQUE_IDENTIFIER property
    // This will be used to create custom property if it doesn't exist in HubSpot
    const segmentUniqueIdentifierProperty = {
      name: SEGMENT_UNIQUE_IDENTIFIER,
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

    // Store Company ID in parent scope
    // This would later be used to associate company with contact
    let companyId = ''

    // Try to update company using SEGMENT_UNIQUE_IDENTIFIER
    try {
      const updateCompanyResponse = await updateCompany(
        request,
        payload.groupid,
        companyProperties,
        SEGMENT_UNIQUE_IDENTIFIER
      )

      companyId = updateCompanyResponse.data.id
    } catch (e) {
      const error = e as UpsertCompanyError
      // Special Case: If a company already has a SEGMENT_UNIQUE_IDENTIFIER property value, but the property is later deleted from HubSpot
      // the search would still find the correct company, but the update would fail with a 400 error stating property doesn't exist
      // Segment will attempt to create the SEGMENT_UNIQUE_IDENTIFIER property and throw a retryable error to Centrifuge
      if (isSegmentUniqueIdentifierPropertyError(error, SEGMENT_UNIQUE_IDENTIFIER)) {
        await createCompanyProperty(request, segmentUniqueIdentifierProperty)
        throw SegmentUniqueIdentifierMissingRetryableError
      }

      // HubSpot returns a 404 error if the company is not found or if an invalid unique identifier is used, ignore the error
      if (
        error?.response?.status !== 404 &&
        !isSegmentUniqueIdentifierPropertyError(error, SEGMENT_UNIQUE_IDENTIFIER)
      ) {
        throw e
      }
    }

    // If update company using SEGMENT_UNIQUE_IDENTIFIER was successful, companyId would have a truthy value
    // If the value is truthy, skip to the upsert operation at the end
    if (!companyId) {
      // Attempt to search company with Company Search Fields
      // If Company Search Fields doesn't have any defined property, skip the search and assume Company was not found
      let searchCompanyResponse: ModifiedResponse<SearchCompanyResponse> | null = null
      if (typeof payload.companysearchfields === 'object' && Object.keys(payload.companysearchfields).length > 0) {
        try {
          searchCompanyResponse = await searchCompany(request, { ...payload.companysearchfields })
        } catch (e) {
          // HubSpot throws a generic 400 error if an undefined property is used in search
          // Throw a more informative error instead
          if ((e as HTTPError)?.response?.status === 400) {
            throw CompanySearchThrowableError
          }
          throw e
        }
      }

      // Check if any companies were found based Company Search Fields
      // If the search was skipped, searchCompanyResponse would have a falsy value (null)
      if (!searchCompanyResponse || searchCompanyResponse.data.total === 0) {
        // No existing company found with search criteria, attempt to create a new company

        try {
          const createCompanyResponse = await createCompany(request, companyProperties)
          companyId = createCompanyResponse.data.id
        } catch (e) {
          const error = e as UpsertCompanyError
          if (isSegmentUniqueIdentifierPropertyError(error, SEGMENT_UNIQUE_IDENTIFIER)) {
            // If creation fails due to SEGMENT_UNIQUE_IDENTIFIER custom property error,
            // attempt to create the custom property and retry

            try {
              await createCompanyProperty(request, segmentUniqueIdentifierProperty)
            } catch (e) {
              // If custom property already exists HubSpot throws 409 Conflict
              // Ignore this error to avoid race conditions where multiple requests try to create the same custom property
              if ((e as HTTPError)?.response?.status !== 409) {
                throw e
              }
            }

            // Retry company creation
            const createCompanyResponse = await createCompany(request, companyProperties)
            companyId = createCompanyResponse.data.id
          } else {
            throw e
          }
        }
      } else {
        // Throw error if more than one companies were found with search criteria
        if (searchCompanyResponse.data.total > 1) {
          throw MultipleCompaniesInSearchResultThrowableError
        }

        // An existing company was identified, attempt to update the company
        companyId = searchCompanyResponse.data.results[0].id

        try {
          await updateCompany(request, companyId, companyProperties)
        } catch (e) {
          const error = e as UpsertCompanyError
          if (isSegmentUniqueIdentifierPropertyError(error, SEGMENT_UNIQUE_IDENTIFIER)) {
            // If update fails due to SEGMENT_UNIQUE_IDENTIFIER custom property error,
            // attempt to create the custom property and retry

            try {
              await createCompanyProperty(request, segmentUniqueIdentifierProperty)
            } catch (e) {
              // If custom property already exists HubSpot throws 409 Conflict
              // This is ignored to avoid race conditions where multiple requests try to create the same custom property
              if ((e as HTTPError)?.response?.status !== 409) {
                throw e
              }
            }

            await updateCompany(request, companyId, companyProperties)
          } else {
            throw e
          }
        }
      }
    }
    // If upsert company is successful, associate company with contact
    await associateCompanyToContact(
      request,
      companyId,
      transactionContext?.transaction?.['contact_id'],
      ASSOCIATION_TYPE
    )
  }
}

/**
 * Searches for a company by Company Search Fields
 * @param {RequestClient} request RequestClient instance
 * @param {{[key: string]: unknown}} companySearchFields A list of key-value pairs of unique properties to identify a company
 * @param {String} [idProperty] Unique property of company to match with uniqueIdentifier, if this parameter is not defined then uniqueIdentifier is matched with HubSpot generated Company ID
 * @returns {Promise<ModifiedResponse<SearchCompanyResponse>>} A promise that resolves to a list of companies matching the search criteria
 */
function searchCompany(request: RequestClient, companySearchFields: { [key: string]: unknown }) {
  // Generate company search payload
  const responseProperties: string[] = ['name', 'domain', 'lifecyclestage', SEGMENT_UNIQUE_IDENTIFIER]
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

/**
 * Creates a Company CRM object in HubSpot
 * @param {RequestClient} request RequestClient instance
 * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties of the Company
 * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves to updated company object
 */
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

/**
 * Updates a Company CRM object in HubSPot identified by company's ID or a unique property ID
 * @param {RequestClient} request RequestClient instance
 * @param {string} uniqueIdentifier A unique identifier value of the property
 * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties to update
 * @param {String} [idProperty] Unique property of company to match with uniqueIdentifier, if this parameter is not defined then uniqueIdentifier is matched with HubSpot generated Company ID
 * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves to updated company object
 */
function updateCompany(
  request: RequestClient,
  uniqueIdentifier: string,
  properties: { [key: string]: unknown },
  idProperty?: string
) {
  // Construct the URL to update company
  // URL to update company by ID: /crm/v3/objects/companies/{companyId}
  // URL to update company by unique property: /crm/v3/objects/companies/{uniqueIdentifier}?idProperty={uniquePropertyInternalName}
  const updateCompanyURL =
    `${hubSpotBaseURL}/crm/v3/objects/companies/${uniqueIdentifier}` + (idProperty ? `?idProperty=${idProperty}` : '')

  return request<UpsertCompanyResponse>(updateCompanyURL, {
    method: 'PATCH',
    json: {
      properties: {
        ...properties
      }
    }
  })
}

/**
 * Adds a custom property to Companies CRM Object
 * @param {RequestClient} request RequestClient instance
 * @param {CompanyProperty} property Property to add to Companies CRM Object
 * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves to Property creation status
 */
function createCompanyProperty(request: RequestClient, property: CompanyProperty) {
  return request<UpsertCompanyResponse>(`${hubSpotBaseURL}/crm/v3/properties/companies`, {
    method: 'POST',
    json: {
      ...property
    }
  })
}

/**
 * Associates a Company CRM object with a Contact CRM object
 * @param {RequestClient} request RequestClient instance
 * @param {string} companyId HubSpot generated unique identifier for a Company CRM Object
 * @param {string} contactId HubSpot generated unique identifier for a Contact CRM Object
 * @returns {Promise<ModifiedResponse<CompanyContactAssociationResponse>>} A promise that resolves to Property creation status
 */
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
