import { HTTPError } from '@segment/actions-core'
import { ModifiedResponse } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { CustomSearchToAssociateThrowableError } from '../errors'

import { HUBSPOT_BASE_URL } from '../properties'
import {
  AssociationType,
  CreateAssociation,
  SearchFilterOperator,
  SearchPayload,
  SearchResponse,
  UpsertRecordResponse
} from '../utils'

export class Hubspot {
  request: RequestClient
  objectType: string
  toObjectType?: string

  constructor(request: RequestClient, objectType: string, toObjectType?: string) {
    this.request = request
    this.objectType = objectType
    this.toObjectType = toObjectType
  }

  /**
   * Searches for object records by search fields
   * @param {{[key: string]: unknown}} searchFields A list of key-value pairs of unique properties to identify a object record of ObjectType
   * @param { string[]} responseProperties - An array of properties to return in response.
   * @param { string[]} responseSortBy - To sort an response
   * @returns {Promise<ModifiedResponse<SearchResponse>>} A promise that resolves to a list of object records matching the search criteria
   */
  async search(
    searchFields: { [key: string]: unknown },
    objectType: string,
    responseProperties: string[],
    responseSortBy: string[]
  ) {
    if (typeof searchFields === 'object' && Object.keys(searchFields).length > 0) {
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

      return this.request<SearchResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/search`, {
        method: 'POST',
        json: {
          ...searchPayload
        }
      })
    }
    return null
  }

  /**
   * Creates a CRM object in HubSpot
   * @param {{[key: string]: unknown}} properties A list of key-value pairs of properties of the object
   * @returns {Promise<ModifiedResponse<UpsertCompanyResponse>>} A promise that resolves the updated object
   */
  async create(properties: { [key: string]: unknown }, associations: CreateAssociation[] = []) {
    return this.request<UpsertRecordResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${this.objectType}`, {
      method: 'POST',
      json: {
        properties: properties,
        associations: associations
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

  /**
   * Updates a CRM object in HubSPot identified by record ID or a unique property ID
   * @param {string} fromObjectType A unique identifier value of the property
   * @param {String} toObjectType Unique property of object record to match with uniqueIdentifier, if this parameter is not defined then uniqueIdentifier is matched with HubSpot generated record ID
   * @param {batchInput[]} input Unique property of object record to match with uniqueIdentifier, if this parameter is not defined then uniqueIdentifier is matched with HubSpot generated record ID
   * @returns {Promise<ModifiedResponse<UpsertRecordResponse>>} A promise that resolves the updated object
   */
  async associate(objectId: string, toObjectId: string, associations: AssociationType[]) {
    const associateURL = `${HUBSPOT_BASE_URL}/crm/v4/objects/${this.objectType}/${objectId}/associations/${this.toObjectType}/${toObjectId}`

    return this.request<UpsertRecordResponse>(associateURL, {
      method: 'PUT',
      json: associations
    })
  }

  async getObjectResponseToAssociate(
    searchFieldsToAssociateCustomObjects: { [key: string]: unknown } | undefined,
    associationType: AssociationType | null
  ) {
    try {
      if (
        this.toObjectType &&
        associationType &&
        Object.keys(associationType).length > 0 &&
        searchFieldsToAssociateCustomObjects &&
        Object.keys(searchFieldsToAssociateCustomObjects).length > 0
      ) {
        let searchCustomResponseToAssociate: ModifiedResponse<SearchResponse> | null = null
        searchCustomResponseToAssociate = await this.search(
          { ...searchFieldsToAssociateCustomObjects },
          this.toObjectType,
          [],
          []
        )
        if (searchCustomResponseToAssociate?.data && searchCustomResponseToAssociate?.data?.total) {
          return searchCustomResponseToAssociate
        }
      }
      return null
    } catch (e) {
      // HubSpot throws a generic 400 error if an undefined property is used in search
      // Throw a more informative error instead
      if ((e as HTTPError)?.response?.status === 400) {
        throw CustomSearchToAssociateThrowableError
      }
      throw e
    }
  }
}
