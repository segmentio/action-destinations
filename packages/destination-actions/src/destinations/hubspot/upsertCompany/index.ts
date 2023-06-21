import { ActionDefinition, RequestClient, ModifiedResponse, HTTPError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL, SEGMENT_UNIQUE_IDENTIFIER, ASSOCIATION_TYPE } from '../properties'
import {
  HubSpotError,
  MissingIdentityCallThrowableError,
  RestrictedPropertyThrowableError,
  SegmentUniqueIdentifierMissingRetryableError,
  MultipleCompaniesInSearchResultThrowableError,
  isSegmentUniqueIdentifierPropertyError,
  CompanySearchThrowableError
} from '../errors'
import { flattenObject, ResponseInfo, SearchResponse, UpsertRecordResponse } from '../utils'
import { Hubspot } from '../api'

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

interface CompanyContactAssociationResponse extends ResponseInfo {
  associations: {
    contacts?: {
      results: Record<string, unknown>[]
    }
  }
}

type UpsertCompanyFunction = () => Promise<ModifiedResponse<UpsertRecordResponse>>

/**
 * Upsert Company Action works as follows:
 * 1. Check if associateContact flag is set to true AND contact_id is not defined in transactionContext,
 *    if the above condition is true then throw error, else continue to step 2
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
 * 5. An existing company was not found, try creating a company
 *    Case a: If createNewCompany flag is set to false, exit the flow without creating a company
 *    Case b: If company is created, move to Step 7
 *    Case c: If company is not created due to missing SEGMENT_UNIQUE_IDENTIFIER
 *            create the property and retry creation of company, move to Step 7 if it succeeds
 *    Case d: If any other error occurs in the flow, throw the error
 * 6. Existing company is found, update the company with new properties
 *    Case a: If company is updated, move to Step 7
 *    Case b: If company is not updated due to missing SEGMENT_UNIQUE_IDENTIFIER
 *            create the property and retry to update of company, move to Step 7 if it succeeds
 *    Case c: If any other error occurs in the flow, throw the error
 * 7. Check if associateContact flag is set to true
 *    Case a: If true, associate company with Contact ID from transactionContext, throw error if any
 *    Case b: If false, skip association of contact with company
 */

// Note: Some of the action fields are not in Camel Case to maintain parity with HubSpot API

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Company',
  description: 'Create or update a company in HubSpot.',
  defaultSubscription: 'type = "group"',
  fields: {
    groupid: {
      label: 'Unique Company Identifier',
      description:
        'A unique identifier you assign to a company. Segment creates a custom property in HubSpot to store this value for each company so it can be used as a unique search field. Segment recommends not changing this value once set to avoid creating duplicate companies.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.groupId' },
          then: { '@path': '$.groupId' },
          else: { '@path': '$.context.groupId' }
        }
      }
    },
    createNewCompany: {
      label: 'Create Company if Not Found',
      description:
        'If true, Segment will attempt to update an existing company in HubSpot and if no company is found, Segment will create a new company. If false, Segment will only attempt to update an existing company and never create a new company. This is set to true by default.',
      type: 'boolean',
      required: true,
      default: true
    },
    associateContact: {
      label: 'Associate Contact with Company',
      description:
        'If true, Segment will associate the company with the user identified in your payload. If no contact is found in HubSpot, an error is thrown and the company is not created/updated. If false, Segment will not attempt to associate a contact with the company and companies can be created/updated without requiring a contact association. This is set to true by default.',
      type: 'boolean',
      required: true,
      default: true
    },
    companysearchfields: {
      label: 'Company Search Fields',
      description:
        'The unique field(s) used to search for an existing company in HubSpot to update. By default, Segment creates a custom property to store groupId for each company and uses this property to search for companies. If a company is not found, the fields provided here are then used to search. If a company is still not found, a new one is created.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    name: {
      label: 'Company Name',
      description: 'The name of the company.',
      type: 'string',
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
      description: `Any other default or custom company properties. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties). Important: Do not use ’${SEGMENT_UNIQUE_IDENTIFIER}’ here as it is an internal property and will result in an an error.`,
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

    // If associateContact field is set to true, check if transactionContext is defined and contact_id is present in TransactionContext
    if (payload.associateContact && !transactionContext?.transaction?.contact_id) {
      throw MissingIdentityCallThrowableError
    }
    const hubspotApiClient: Hubspot = new Hubspot(request, 'companies')

    // Construct company properties
    const companyProperties = {
      name: payload.name,
      description: payload.description,
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
      ...flattenObject(payload.properties)
    }

    // Store Company ID in parent scope
    // This would later be used to associate company with contact
    let companyId = ''

    // Try to update company using SEGMENT_UNIQUE_IDENTIFIER
    try {
      const updateCompanyResponse = await hubspotApiClient.update(
        payload.groupid,
        companyProperties,
        SEGMENT_UNIQUE_IDENTIFIER
      )

      companyId = updateCompanyResponse.data.id
    } catch (e) {
      const error = e as HubSpotError
      // Special Case: If a company already has a SEGMENT_UNIQUE_IDENTIFIER property value, but the property is later deleted from HubSpot
      // the search would still find the correct company, but the update would fail with a 400 error stating property doesn't exist
      // Segment will attempt to create the SEGMENT_UNIQUE_IDENTIFIER property and throw a retryable error to Centrifuge
      if (isSegmentUniqueIdentifierPropertyError(error, SEGMENT_UNIQUE_IDENTIFIER)) {
        await createSegmentUniqueIdentifierProperty(request)
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
      let searchCompanyResponse: ModifiedResponse<SearchResponse> | null = null

      if (typeof payload.companysearchfields === 'object' && Object.keys(payload.companysearchfields).length > 0) {
        try {
          const responseProperties: string[] = ['name', 'domain', 'lifecyclestage', SEGMENT_UNIQUE_IDENTIFIER]
          const responseSortBy: string[] = ['name']

          searchCompanyResponse = await hubspotApiClient.search(
            { ...payload.companysearchfields },
            responseProperties,
            responseSortBy
          )
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
      if (!searchCompanyResponse?.data || searchCompanyResponse?.data?.total === 0) {
        // No existing company found with search criteria, attempt to create a new company

        // If Create New Company flag is set to false, skip creation
        if (!payload.createNewCompany) {
          return
        }

        // Create a wrapper function which calls createCompany and returns the response
        const createCompanyWrapper = async function () {
          return await hubspotApiClient.create(companyProperties)
        }

        companyId = await upsertCompanyWithRetry(request, createCompanyWrapper)
      } else {
        // Throw error if more than one companies were found with search criteria
        if (searchCompanyResponse.data.total > 1) {
          throw MultipleCompaniesInSearchResultThrowableError
        }

        // An existing company was identified, attempt to update the company
        companyId = searchCompanyResponse.data.results[0].id

        // Create a wrapper function which calls updateCompany and returns the response
        const updateCompanyWrapper = async function () {
          return await hubspotApiClient.update(companyId, companyProperties)
        }

        await upsertCompanyWithRetry(request, updateCompanyWrapper)
      }
    }

    // Associate company with contact if Associate Contact flag is set to true
    if (payload.associateContact && transactionContext?.transaction?.contact_id) {
      await associateCompanyToContact(request, companyId, transactionContext.transaction.contact_id, ASSOCIATION_TYPE)
    }
  }
}

/**
 * Adds a custom property to Companies CRM Object
 * @param {RequestClient} request RequestClient instance
 * @param {CompanyProperty} property Property to add to Companies CRM Object
 * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves to Property creation status
 */
function createSegmentUniqueIdentifierProperty(request: RequestClient) {
  // Define SEGMENT_UNIQUE_IDENTIFIER property
  const segmentUniqueIdentifierProperty: CompanyProperty = {
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

  return request<UpsertRecordResponse>(`${HUBSPOT_BASE_URL}/crm/v3/properties/companies`, {
    method: 'POST',
    json: {
      ...segmentUniqueIdentifierProperty
    }
  })
}

/**
 * Associates a Company CRM object with a Contact CRM Object
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
    `${HUBSPOT_BASE_URL}/crm/v3/objects/companies/${companyId}/associations/contacts/${contactId}/${associationType}`,
    {
      method: 'PUT'
    }
  )
}

/**
 * Creates or updates a Company with error handling and retries
 * @param {RequestClient} request RequestClient instance
 * @param {UpsertCompanyFunction} upsertCompanyFunction A wrapper function on createCompany and updateCompany
 * @returns {Promise<String>} A promise that contains the id of the company being created or updated
 */
async function upsertCompanyWithRetry(request: RequestClient, upsertCompanyFunction: UpsertCompanyFunction) {
  try {
    const upsertCompanyResponse = await upsertCompanyFunction()
    return upsertCompanyResponse.data.id
  } catch (e) {
    const error = e as HubSpotError
    if (isSegmentUniqueIdentifierPropertyError(error, SEGMENT_UNIQUE_IDENTIFIER)) {
      // If upsert action fails due to SEGMENT_UNIQUE_IDENTIFIER custom property error,
      // attempt to create the custom property and retry

      try {
        // Attempt to create Segment Unique Identifier Property
        await createSegmentUniqueIdentifierProperty(request)
      } catch (e) {
        // If custom property already exists HubSpot throws 409 Conflict
        // Ignore this error to avoid race conditions where multiple requests try to create the same custom property
        if ((e as HTTPError)?.response?.status !== 409) {
          throw e
        }
      }

      // Retry company upsert action
      const upsertCompanyResponse = await upsertCompanyFunction()
      return upsertCompanyResponse.data.id
    } else {
      throw e
    }
  }
}

export default action
