import { RequestClient } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import { SearchFilterOperator, SearchPayload, SearchResponse, UpsertRecordResponse } from '../utils'

export class Hubspot {
  request: RequestClient
  objectType: string

  constructor(request: RequestClient, objectType: string) {
    this.request = request
    this.objectType = objectType
  }

  /**
   * Searches for object records by search fields
   * @param {{[key: string]: unknown}} searchFields A list of key-value pairs of unique properties to identify a object record of ObjectType
   * @param { string[]} responseProperties - An array of properties to return in response.
   * @param { string[]} responseSortBy - To sort an response
   * @returns {Promise<ModifiedResponse<SearchResponse>>} A promise that resolves to a list of object records matching the search criteria
   */
  async search(searchFields: { [key: string]: unknown }, responseProperties: string[], responseSortBy: string[]) {
    const searchPayload: SearchPayload = {
      filterGroups: [],
      properties: [...responseProperties],
      sorts: [...responseSortBy]
    }
    for (const [key, value] of Object.entries(searchFields)) {
      searchPayload.filterGroups.push({
        filters: [
          {
            propertyName: key,
            operator: SearchFilterOperator.EQ,
            value
          }
        ]
      })
    }

    return this.request<SearchResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${this.objectType}/search`, {
      method: 'POST',
      json: {
        ...searchPayload
      }
    })
  }

  /**
   * Creates a CRM object in HubSpot
   * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties of the object
   * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves the updated object
   */
  async create(properties: { [key: string]: unknown }) {
    return this.request<UpsertRecordResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${this.objectType}`, {
      method: 'POST',
      json: {
        properties: properties
      }
    })
  }

  /**
   * Updates a CRM object in HubSPot identified by record ID or a unique property ID
   * @param {string} uniqueIdentifier A unique identifier value of the property
   * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties to update
   * @param {String} [idProperty] Unique property of object record to match with uniqueIdentifier, if this parameter is not defined then uniqueIdentifier is matched with HubSpot generated record ID
   * @returns {Promise<ModifiedResponse<UpsertRecordResponse>>} A promise that resolves the updated object
   */
  async update(uniqueIdentifier: string, properties: { [key: string]: unknown }, idProperty?: string) {
    // Construct the URL to update record of given objectType
    // URL to update record by ID: /crm/v3/objects/{objectType}/{objectId}
    // URL to update record by unique property: /crm/v3/objects/{objectType}/{uniqueIdentifier}?idProperty={uniquePropertyInternalName}
    const updateURL =
      `${HUBSPOT_BASE_URL}/crm/v3/objects/${this.objectType}/${uniqueIdentifier}` +
      (idProperty ? `?idProperty=${idProperty}` : '')

    return this.request<UpsertRecordResponse>(updateURL, {
      method: 'PATCH',
      json: {
        properties: properties
      }
    })
  }
}
