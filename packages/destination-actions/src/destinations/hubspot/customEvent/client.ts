import { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import {
  CreateEventDefinitionResp,
  CreateEventDefinitionReq,
  CreatePropDefinitionReq,
  GetEventDefinitionResp,
  EventCompletionReq,
  PropertyCreateResp
} from './types'

export class Client {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async getEventDefinition(eventName: string): Promise<ModifiedResponse<GetEventDefinitionResp>> {
    return await this.request<GetEventDefinitionResp>(
      `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${eventName}/?includeProperties=true`,
      {
        method: 'GET',
        skipResponseCloning: true,
        throwHttpErrors: false
      }
    )
  }

  async send(json: EventCompletionReq) {
    return this.request(`${HUBSPOT_BASE_URL}/events/v3/send`, {
      method: 'POST',
      json
    })
  }

  async createEventDefinition(json: CreateEventDefinitionReq): Promise<ModifiedResponse<CreateEventDefinitionResp>> {
    return await this.request<CreateEventDefinitionResp>(`${HUBSPOT_BASE_URL}/events/v3/event-definitions`, {
      method: 'POST',
      json,
      skipResponseCloning: true,
      throwHttpErrors: false
    })
  }

  async createPropertyDefinition(json: CreatePropDefinitionReq, eventName: string) {
    return this.request<PropertyCreateResp>(`${HUBSPOT_BASE_URL}/events/v3/event-definitions/${eventName}/property`, {
      method: 'POST',
      json,
      throwHttpErrors: false
    })
  }
}
