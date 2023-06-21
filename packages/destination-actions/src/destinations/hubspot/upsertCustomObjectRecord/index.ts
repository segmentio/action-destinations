import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { CustomSearchThrowableError, HubSpotError, MultipleCustomRecordsInSearchResultThrowableError } from '../errors'
import { flattenObject, SearchResponse, UpsertRecordResponse } from '../utils'
import { ModifiedResponse } from '@segment/actions-core'
import { HTTPError } from '@segment/actions-core'
import { Hubspot } from '../api'

interface ObjectSchema {
  labels: { singular: string; plural: string }
  fullyQualifiedName: string
}

interface GetSchemasResponse {
  results: ObjectSchema[]
}

// slug name - upsertCustomObjectRecord. We will be introducing upsert logic soon.
// To avoid slug name changes in future, naming it as upsertCustomObjectRecord straight away.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Custom Object Record',
  description: 'Upsert records of Deals, Tickets or other Custom Objects in HubSpot.',
  fields: {
    createNewCustomRecord: {
      label: 'Create Custom Object Record if Not Found',
      description:
        'If true, Segment will attempt to update an existing custom object record in HubSpot and if no record is found, Segment will create a new custom object record. If false, Segment will only attempt to update an existing record and never create a new record. This is set to true by default.',
      type: 'boolean',
      default: true
    },
    customObjectSearchFields: {
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
    let searchCustomResponse: ModifiedResponse<SearchResponse> | null = null
    const hubspotApiClient: Hubspot = new Hubspot(request, payload.objectType)
    if (
      typeof payload.customObjectSearchFields === 'object' &&
      Object.keys(payload.customObjectSearchFields).length > 0
    ) {
      try {
        // Generate custom search payload
        const responseSortBy: string[] = ['name']
        searchCustomResponse = await hubspotApiClient.search(
          { ...payload.customObjectSearchFields },
          [],
          responseSortBy
        )
      } catch (e) {
        // HubSpot throws a generic 400 error if an undefined property is used in search
        // Throw a more informative error instead
        if ((e as HTTPError)?.response?.status === 400) {
          throw CustomSearchThrowableError
        }
        throw e
      }
    }
    // Store Custom Object Record Id in parent scope
    // This would be used to store custom object record Id after search or create.
    let upsertCustomRecordResponse: ModifiedResponse<UpsertRecordResponse>
    // Check if any custom object record were found based Custom Search Fields
    // If the search was skipped, searchCustomResponse would have a falsy value (null)
    if (!searchCustomResponse?.data || searchCustomResponse?.data?.total === 0) {
      // No existing custom object record found with search criteria, attempt to create a new custom object record

      // setting the createNewCustomRecord default value to true if it's not provided.
      const createNewCustomRecord = payload?.createNewCustomRecord ?? true
      // If Create New custom object record flag is set to false, skip creation
      if (!createNewCustomRecord) {
        return 'There was no record found to update. If you want to create a new custom object record in such cases, enable the Create Custom Object Record if Not Found flag'
      }
      const properties = { ...flattenObject(payload.properties) }
      upsertCustomRecordResponse = await hubspotApiClient.create(properties)
    } else {
      // Throw error if more than one custom object record were found with search criteria
      if (searchCustomResponse?.data?.total > 1) {
        throw MultipleCustomRecordsInSearchResultThrowableError
      }
      // An existing Custom object record was identified, attempt to update the same record
      upsertCustomRecordResponse = await hubspotApiClient.update(
        searchCustomResponse.data.results[0].id,
        payload.properties
      )
    }
    return upsertCustomRecordResponse.data
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

export default action
