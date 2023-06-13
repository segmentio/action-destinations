import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { CustomSearchThrowableError, HubSpotError, MultipleCustomRecordsInSearchResultThrowableError } from '../errors'
import { flattenObject } from '../helperFunctions'
import { ModifiedResponse } from '@segment/actions-core'
import { HTTPError } from '@segment/actions-core'

interface ObjectSchema {
  labels: { singular: string; plural: string }
  fullyQualifiedName: string
}

interface GetSchemasResponse {
  results: ObjectSchema[]
}
interface CustomInfo {
  id: string
  properties: Record<string, string>
}

interface SearchCustomResponse {
  total: number
  results: CustomInfo[]
}

enum CustomSearchFilterOperator {
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

interface CustomSearchFilter {
  propertyName: string
  operator: CustomSearchFilterOperator
  value: unknown
}

interface customSearchFilterGroup {
  filters: CustomSearchFilter[]
}
interface CustomSearchPayload {
  filterGroups: customSearchFilterGroup[]
  properties?: string[]
  sorts?: string[]
  limit?: number
  after?: number
}

interface UpsertCustomRecordResponse extends CustomInfo {}

// slug name - upsertCustomObjectRecord. We will be introducing upsert logic soon.
// To avoid slug name changes in future, naming it as upsertCustomObjectRecord straight away.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Custom Object Record',
  description: 'Upsert records of Deals, Tickets or other Custom Objects in HubSpot.',
  fields: {
    createNewCustomRecord: {
      label: 'Create Custom Record if Not Found',
      description:
        'If true, Segment will attempt to update an existing custom record in HubSpot and if no record is found, Segment will create a new custom record. If false, Segment will only attempt to update an existing record and never create a new record. This is set to true by default.',
      type: 'boolean',
      required: true,
      default: true
    },
    customSearchFields: {
      label: 'Custom Object Search Fields',
      description:
        'The unique field(s) used to search for an existing record in HubSpot to update. The fields provided here are then used to search. If a custom object is still not found, a new one is created.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    objectType: {
      label: 'Object Type',
      description:
        'The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Schema for the Custom Objects must be predefined in HubSpot. More information on Custom Objects and *fullyQualifiedName* in [HubSpot documentation](https://developers.hubspot.com/docs/api/crm/crm-custom-objects#retrieve-existing-custom-objects).',
      type: 'string',
      required: true,
      dynamic: true
    },
    properties: {
      label: 'Properties',
      description:
        'Properties to send to HubSpot. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Please make sure to include the object’s required properties. Any custom properties must be predefined in HubSpot. More information in [HubSpot documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    }
  },
  dynamicFields: {
    objectType: async (request, _) => {
      return getCustomObjects(request)
    }
  },
  perform: async (request, { payload }) => {
    // Attempt to search Custom Object record with Custom Search Fields
    // If Custom Search Fields doesn't have any defined property, skip the search and assume record was not found
    let searchCustomResponse: ModifiedResponse<SearchCustomResponse> | null = null
    if (typeof payload.customSearchFields === 'object' && Object.keys(payload.customSearchFields).length > 0) {
      try {
        searchCustomResponse = await searchCustomRecord(request, payload.objectType, { ...payload.customSearchFields })
      } catch (e) {
        // HubSpot throws a generic 400 error if an undefined property is used in search
        // Throw a more informative error instead
        if ((e as HTTPError)?.response?.status === 400) {
          throw CustomSearchThrowableError
        }
        throw e
      }
    }
    // Store custom Record Id in parent scope
    // This would be used to store custom record Id after search or create.
    let customRecordId = null
    let upsertCustomRecordResponse: ModifiedResponse<UpsertCustomRecordResponse>
    // Check if any custom record were found based Custom Search Fields
    // If the search was skipped, searchCustomResponse would have a falsy value (null)
    if (!searchCustomResponse || searchCustomResponse?.data?.total === 0) {
      // No existing custom record found with search criteria, attempt to create a new custom record

      // If Create New custom record flag is set to false, skip creation
      if (!payload.createNewCustomRecord) {
        return
      }
      upsertCustomRecordResponse = await createCustomRecord(request, payload.objectType, payload.properties)
      customRecordId = upsertCustomRecordResponse.data.id
    } else {
      // Throw error if more than one custom object record were found with search criteria
      if (searchCustomResponse?.data?.total > 1) {
        throw MultipleCustomRecordsInSearchResultThrowableError
      }
      // An existing Custom object record was identified, attempt to update the same record
      customRecordId = searchCustomResponse?.data?.results?.length ? searchCustomResponse.data.results[0].id : null
      customRecordId ? await updateCustomRecord(request, payload.objectType, customRecordId, payload.properties) : null
    }
  }
}

async function getCustomObjects(request: RequestClient) {
  // List of HubSpot defined Objects that segment has OAuth Scope to access
  const defaultChoices = [
    { value: 'deals', label: 'Deals' },
    { value: 'tickets', label: 'Tickets' }
  ]

  try {
    // API Doc - https://developers.hubspot.com/docs/api/crm/crm-custom-objects#endpoint?spec=GET-/crm/v3/schemas
    //
    const response = await request<GetSchemasResponse>(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
      method: 'GET',
      skipResponseCloning: true
    })
    const choices = response.data.results.map((schema) => ({
      label: schema.labels.plural,
      value: schema.fullyQualifiedName
    }))
    return {
      choices: [...choices, ...defaultChoices]
    }
  } catch (err) {
    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error',
        code: (err as HubSpotError)?.response?.data?.category ?? 'Unknown code'
      }
    }
  }
}

/**
 * Searches for a custom object record by custom search fields
 * @param {RequestClient} request RequestClient instance
 * @param {String} objectType - ObjecType Identifier
 * @param {{[key: string]: unknown}} customSearchFields A list of key-value pairs of unique properties to identify a custom record
 * @returns {Promise<ModifiedResponse<SearchCustomResponse>>} A promise that resolves to a list of custom records matching the search criteria
 */
function searchCustomRecord(
  request: RequestClient,
  objectType: string,
  customSearchFields: { [key: string]: unknown }
) {
  // Generate custom search payload
  const responseSortBy: string[] = ['name']

  const customSearchPayload: CustomSearchPayload = {
    filterGroups: [],
    sorts: [...responseSortBy]
  }

  for (const [key, value] of Object.entries(customSearchFields)) {
    customSearchPayload.filterGroups.push({
      filters: [
        {
          propertyName: key,
          operator: CustomSearchFilterOperator.EQ,
          value
        }
      ]
    })
  }

  return request<SearchCustomResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/search`, {
    method: 'POST',
    json: {
      ...customSearchPayload
    }
  })
}

/**
 * Creates a Custom CRM object in HubSpot
 * @param {RequestClient} request RequestClient instance
 * @param {String} objectType - ObjecType Identifier
 * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties of the Custom Object
 * @returns {Promise<ModifiedResponse<UpsertCustomRecordResponse>>} A promise that resolves to updated Custom object
 */
function createCustomRecord(request: RequestClient, objectType: string, properties: { [key: string]: unknown }) {
  return request<UpsertCustomRecordResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}`, {
    method: 'POST',
    json: {
      properties: flattenObject(properties)
    }
  })
}

/**
 * Updates a Custom Object CRM object in HubSPot identified by Id
 * @param {RequestClient} request RequestClient instance
 * @param {String} objectType - ObjecType Identifier
 * @param {String} customObjectId Id of custom record to update.
 * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties to update
 * @returns {Promise<ModifiedResponse<UpsertCustomRecordResponse>>} A promise that resolves to update Custom object record
 */
function updateCustomRecord(
  request: RequestClient,
  objectType: string,
  customObjectId: string,
  properties: { [key: string]: unknown }
) {
  // Construct the URL to update custom object record
  const updateCustomObjectURL = `${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/${customObjectId}`

  return request<UpsertCustomRecordResponse>(updateCustomObjectURL, {
    method: 'PATCH',
    json: {
      properties: properties
    }
  })
}

export default action
