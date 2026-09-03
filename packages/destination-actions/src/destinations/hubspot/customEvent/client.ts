import { Features, RequestClient, ModifiedResponse } from '@segment/actions-core'
import {
  CreateEventDefinitionResp,
  CreateEventDefinitionReq,
  CreatePropDefinitionReq,
  GetEventDefinitionResp,
  EventCompletionReq,
  PropertyCreateResp
} from './types'
import { HubspotUrls, hubspotUrls } from '../versioning-info'

export class Client {
  request: RequestClient
  urls: HubspotUrls

  constructor(request: RequestClient, features?: Features) {
    this.request = request
    this.urls = hubspotUrls(features)
  }

  async getEventDefinition(eventName: string): Promise<ModifiedResponse<GetEventDefinitionResp>> {
    return await this.request<GetEventDefinitionResp>(
      `${this.urls.events}/event-definitions/${eventName}/?includeProperties=true`,
      {
        method: 'GET',
        skipResponseCloning: true,
        throwHttpErrors: false
      }
    )
  }

  async send(json: EventCompletionReq) {
    return this.request(`${this.urls.events}/send`, {
      method: 'POST',
      json
    })
  }

  async createEventDefinition(json: CreateEventDefinitionReq): Promise<ModifiedResponse<CreateEventDefinitionResp>> {
    return await this.request<CreateEventDefinitionResp>(`${this.urls.events}/event-definitions`, {
      method: 'POST',
      json,
      skipResponseCloning: true,
      throwHttpErrors: false
    })
  }

  async createPropertyDefinition(json: CreatePropDefinitionReq, eventName: string) {
    return this.request<PropertyCreateResp>(`${this.urls.events}/event-definitions/${eventName}/property`, {
      method: 'POST',
      json,
      throwHttpErrors: false
    })
  }
}
