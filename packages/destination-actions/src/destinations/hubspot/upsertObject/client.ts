import { RequestClient } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import {
  AssociationsReq,
  DissociationsReq,
  ObjReqType,
  CreateReq,
  CreatePropsReq,
  ReadReq,
  ReadPropsResp,
  BatchObjResp,
  UpsertReq,
  CreateListReq,
  CreateListResp,
  ReadListResp,
  AddRemoveFromListReq
} from './types'

export class Client {
  request: RequestClient
  objectType: string

  constructor(request: RequestClient, objectType: string) {
    this.request = request
    this.objectType = objectType
  }

  async readProperties(sensitive: boolean) {
    const sensitivity = '?dataSensitivity=sensitive'
    const response = await this.request<ReadPropsResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}${sensitive ? sensitivity : ''}`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )
    return response
  }

  async createPropertiesDefinition(json: CreatePropsReq) {
    const response = this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
    return response
  }

  async batchObjectRequest(action: ObjReqType, objectType: string, json: ReadReq | UpsertReq | CreateReq) {
    const response = await this.request<BatchObjResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`,
      {
        method: 'POST',
        json
      }
    )
    return response
  }

  async batchAssociationsRequest(json: AssociationsReq, toObjectType: string) {
    console.log("Creating associations in HubSpot", JSON.stringify({ json, toObjectType }, null, 2)) // --- IGNORE ---
    const response = await this.request(
      `${HUBSPOT_BASE_URL}/crm/v4/associations/${this.objectType}/${toObjectType}/batch/create`,
      {
        method: 'POST',
        json
      }
    )
    return response
  }

  async batchDissociationsRequest(json: DissociationsReq, toObjectType: string) {
    console.log("Dissociating in HubSpot", JSON.stringify({ json, toObjectType }, null, 2)) // --- IGNORE ---
    const response = await this.request(
      `${HUBSPOT_BASE_URL}/crm/v4/associations/${this.objectType}/${toObjectType}/batch/archive`,
      {
        method: 'POST',
        json
      }
    )
    return response
  }

  async readList(name: string) {
    const response = await this.request<ReadListResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/lists/object-type-id/${this.objectType}/name/${name}`,
      {
        method: 'GET'
      }
    )
    return response
  }

  async createList(json: CreateListReq) {
    const response = await this.request<CreateListResp>(`${HUBSPOT_BASE_URL}/crm/v3/lists`, {
      method: 'POST',
      json
    })
    return response
  }

  async addRemoveFromList(listId: string, json: AddRemoveFromListReq) {
    console.log('Adding/removing from list', listId, json)
    const response = await this.request<CreateListResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/lists/${listId}/memberships/add-and-remove`,
      {
        method: 'PUT',
        json
      }
    )
    return response
  }
}
