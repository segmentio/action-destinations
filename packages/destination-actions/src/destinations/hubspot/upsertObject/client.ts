import { RequestClient } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import {
  AssociationsReq,
  ObjReqType,
  CreateReq,
  CreatePropsReq,
  ReadReq,
  ReadPropsResp,
  BatchObjResp,
  UpsertReq,
  AssociationsAction,
  ReadListsReq,
  ReadListsResp,
  ReadObjectSchemaResp,
  CreateListReq,
  CreateListResp
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

  async batchAssociationsRequest(json: AssociationsReq, toObjectType: string, action: AssociationsAction) {
    const response = await this.request(
      `${HUBSPOT_BASE_URL}/crm/v4/associations/${this.objectType}/${toObjectType}/batch/${action}`,
      {
        method: 'POST',
        json
      }
    )
    return response
  }

  async readLists(json: ReadListsReq) {
    const response = await this.request<ReadListsResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/lists/search`,
      {
        method: 'POST',
        skipResponseCloning: true,
        json
      }
    )
    return response
  }

  async readObjectSchema() {
    const response = await this.request<ReadObjectSchemaResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/schemas/${this.objectType}`, 
      {
        method: 'GET'
      }
    )
    return response
  }

  async createList(json: CreateListReq) {
    const response = await this.request<CreateListResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/lists`, 
      {
        method: 'POST',
        json,
        throwHttpErrors: false
      }
    )
    return response
  }
}