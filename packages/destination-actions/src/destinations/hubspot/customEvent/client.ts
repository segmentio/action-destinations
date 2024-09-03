import { RequestClient } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from '../properties'
import {
  CreateEventDefinitionResp,
  CreateEventDefinitionReq,
  CreatePropertyDefintionReq,
  GetEventDefinitionResp,
  EventCompletionReq
} from './types'

export class Client {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async getEventDefinition(eventName: string): Promise<GetEventDefinitionResp> {
    const url = `${HUBSPOT_BASE_URL}/events/v3/event-definitions/${eventName}/?includeProperties=true`

    const response = await this.request(url, {
      method: 'GET',
      skipResponseCloning: true
    })

    return response.data as GetEventDefinitionResp
  }

  async send(json: EventCompletionReq) {
    return this.request(`${HUBSPOT_BASE_URL}/events/v3/send`, {
      method: 'POST',
      json
    })
  }

  async createEventDefinition(json: CreateEventDefinitionReq): Promise<CreateEventDefinitionResp> {
    const response = await this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions`, {
      method: 'POST',
      json
    })

    return response.data as CreateEventDefinitionResp
  }

  async createPropertyDefinition(json: CreatePropertyDefintionReq, eventName: string) {
    return this.request(`${HUBSPOT_BASE_URL}/events/v3/event-definitions/${eventName}/property`, {
      method: 'POST',
      json
    })
  }
}
