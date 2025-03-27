import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import {
  OptEventProperties,
  EventItem,
  EventItemWithProps,
  CreateEventJSON,
  SendEventJSON,
} from './types'

export class OptimizelyWebClient {
  request: RequestClient
  settings: Settings

  constructor(request: RequestClient, settings: Settings) {
    ;(this.request = request), (this.settings = settings)
  }

  async getCustomEvents() {
    const url = `https://api.optimizely.com/v2/events?per_page=100&include_classic=false&project_id=${this.settings.projectID}`
        
    return await this.request<EventItem[]>(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${this.settings.optimizelyApiKey}`
      }
    })
  }

  async getCustomEvent(event_id: string) {
    const url = `https://api.optimizely.com/v2/events/${event_id}?include_classic=false`

    return await this.request<EventItemWithProps>(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${this.settings.optimizelyApiKey}`
      }
    })
  }

  async createCustomEvent(
    key: string,
    optEventProperties: OptEventProperties
  ) {
    const url = `https://api.optimizely.com/v2/projects/${this.settings.projectID}/custom_events`

    const json = {
      category: 'other',
      event_type: 'custom',
      key,
      name: key,
      event_properties: optEventProperties
        ? Object.keys(optEventProperties).map((key) => ({
            data_type: typeof optEventProperties[key],
            name: key
          }))
        : undefined
    }

    return await this.request<EventItemWithProps>(url, {
      method: 'POST',
      json: json as CreateEventJSON,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${this.settings.optimizelyApiKey}`
      }
    })
  }

  async sendEvent(body: SendEventJSON) {
    return this.request('https://logx.optimizely.com/v1/events', {
      method: 'POST',
      json: body,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      }
    })
  }
}
