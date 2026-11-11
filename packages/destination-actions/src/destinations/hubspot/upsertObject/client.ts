import { Features, RequestClient } from '@segment/actions-core'
import {
  AssociationsReq,
  ObjReqType,
  CreateReq,
  CreatePropsReq,
  ReadReq,
  ReadPropsResp,
  BatchObjResp,
  UpsertReq,
  UpdateReq,
  CreateListReq,
  CreateListResp,
  ReadListResp,
  AddRemoveFromListReq
} from './types'
import { HubspotUrls, hubspotUrls } from '../versioning-info'

export class Client {
  request: RequestClient
  objectType: string
  urls: HubspotUrls

  constructor(request: RequestClient, objectType: string, features?: Features) {
    this.request = request
    this.objectType = objectType
    this.urls = hubspotUrls(features)
  }

  async readProperties(sensitive: boolean) {
    const sensitivity = '?dataSensitivity=sensitive'
    const response = await this.request<ReadPropsResp>(
      `${this.urls.properties}/${this.objectType}${sensitive ? sensitivity : ''}`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )
    return response
  }

  async createPropertiesDefinition(json: CreatePropsReq) {
    const response = this.request(`${this.urls.properties}/${this.objectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
    return response
  }

  async batchObjectRequest(action: ObjReqType, objectType: string, json: ReadReq | UpsertReq | UpdateReq | CreateReq) {
    const response = await this.request<BatchObjResp>(`${this.urls.objects}/${objectType}/batch/${action}`, {
      method: 'POST',
      json
    })
    return response
  }

  async batchAssociationsRequest(json: AssociationsReq, toObjectType: string) {
    const response = await this.request(`${this.urls.associations}/${this.objectType}/${toObjectType}/batch/create`, {
      method: 'POST',
      json
    })
    return response
  }

  async batchDissociationsRequest(json: AssociationsReq, toObjectType: string) {
    const response = await this.request(
      `${this.urls.associations}/${this.objectType}/${toObjectType}/batch/labels/archive`,
      {
        method: 'POST',
        json
      }
    )
    return response
  }

  async readList(name: string) {
    const response = await this.request<ReadListResp>(
      `${this.urls.lists}/object-type-id/${this.objectType}/name/${name}`,
      {
        method: 'GET'
      }
    )
    return response
  }

  async createList(json: CreateListReq) {
    const response = await this.request<CreateListResp>(`${this.urls.lists}`, {
      method: 'POST',
      json
    })
    return response
  }

  async addRemoveFromList(listId: string, json: AddRemoveFromListReq) {
    const response = await this.request<CreateListResp>(`${this.urls.lists}/${listId}/memberships/add-and-remove`, {
      method: 'PUT',
      json
    })
    return response
  }
}
