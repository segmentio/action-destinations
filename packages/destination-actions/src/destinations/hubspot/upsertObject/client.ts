import { RequestClient } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import {
  BatchAssociationsRequestBody,
  BatchRequestType,
  CreateJSON,
  CreatePropsDefinitionReq,
  ReadJSON,
  RespJSON,
  UpsertJSON
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
    const url = `${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}${sensitive ? sensitivity : ''}`
    return this.request<ResponseType>(url, {
      method: 'GET',
      skipResponseCloning: true
    })
  }

  async createPropertiesDefinition(json: CreatePropsDefinitionReq) {
    await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
  }

  async batchObjectRequest(action: BatchRequestType, objectType: string, data: ReadJSON | UpsertJSON | CreateJSON) {
    return this.request<RespJSON>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
      method: 'POST',
      json: data
    })
  }

  async batchAssociationsRequest(body: BatchAssociationsRequestBody, toObjectType: string) {
    return this.request(`${HUBSPOT_BASE_URL}/crm/v4/associations/${this.objectType}/${toObjectType}/batch/create`, {
      method: 'POST',
      json: body
    })
  }
}
