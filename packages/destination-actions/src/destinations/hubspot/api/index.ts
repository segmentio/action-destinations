import { RequestClient } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import { SearchFilterOperator, SearchPayload, SearchResponse, UpsertRecordResponse } from '../utils'

export class Hubspot {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  /**
   * Searches for object records by search fields
   * @param {RequestClient} request RequestClient instance
   * @param {String} objectType - ObjecType Identifier
   * @param {{[key: string]: unknown}} searchFields A list of key-value pairs of unique properties to identify a object record of ObjectType
   * @returns {Promise<ModifiedResponse<SearchResponse>>} A promise that resolves to a list of object records matching the search criteria
   */
  async search(
    request: RequestClient,
    objectType: string,
    searchFields: { [key: string]: unknown },
    searchPayload: SearchPayload
  ) {
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

    return request<SearchResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/search`, {
      method: 'POST',
      json: {
        ...searchPayload
      }
    })
  }

  /**
   * Creates a CRM object in HubSpot
   * @param {RequestClient} request RequestClient instance
   * @param {String} objectType - ObjecType Identifier
   * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties of the object
   * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves the updated object
   */
  async create(request: RequestClient, objectType: string, properties: { [key: string]: unknown }) {
    return request<UpsertRecordResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}`, {
      method: 'POST',
      json: {
        properties: properties
      }
    })
  }

  /**
   * Updates a CRM object in HubSPot identified by record ID or a unique property ID
   * @param {RequestClient} request RequestClient instance
   * @param {String} objectType - ObjecType Identifier
   * @param {string} uniqueIdentifier A unique identifier value of the property
   * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties to update
   * @param {String} [idProperty] Unique property of object record to match with uniqueIdentifier, if this parameter is not defined then uniqueIdentifier is matched with HubSpot generated record ID
   * @returns {Promise<ModifiedResponse<UpsertRecordResponse>>} A promise that resolves the updated object
   */
  async update(
    request: RequestClient,
    objectType: string,
    uniqueIdentifier: string,
    properties: { [key: string]: unknown },
    idProperty?: string
  ) {
    // Construct the URL to update record of given objectType
    // URL to update record by ID: /crm/v3/objects/{objectType}/{companyId}
    // URL to update record by unique property: /crm/v3/objects/{objectType}/{uniqueIdentifier}?idProperty={uniquePropertyInternalName}
    const updateURL =
      `${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/${uniqueIdentifier}` +
      (idProperty ? `?idProperty=${idProperty}` : '')

    return request<UpsertRecordResponse>(updateURL, {
      method: 'PATCH',
      json: {
        properties: properties
      }
    })
  }
}
