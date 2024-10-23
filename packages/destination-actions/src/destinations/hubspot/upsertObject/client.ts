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
  UpsertReq
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
    return this.request<ReadPropsResp>(
      `${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}${sensitive ? sensitivity : ''}`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )
  }

  async createPropertiesDefinition(json: CreatePropsReq) {
    await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
  }

  async batchObjectRequest(action: ObjReqType, objectType: string, json: ReadReq | UpsertReq | CreateReq) {
    json = {"inputs":[{"idProperty":"contact_id","id":"contact_with_cancellation_1","properties":{"cancellation_motive_description":"","sensitive_demo_prop__1":"","contact_id":"contact_with_cancellation_1"}}]}

    return this.request<BatchObjResp>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
      method: 'POST',
      json
    })
  }

  async batchAssociationsRequest(json: AssociationsReq, toObjectType: string) {
    return this.request(`${HUBSPOT_BASE_URL}/crm/v4/associations/${this.objectType}/${toObjectType}/batch/create`, {
      method: 'POST',
      json
    })
  }
}
