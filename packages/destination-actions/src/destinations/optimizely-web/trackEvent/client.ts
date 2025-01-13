import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import {
  OptEventProperties,
  EventItem,
  EventItemWithProps,
  CreateEventJSON,
  CreatePageJSON,
  SendEventJSON,
  Type
} from './types'
import { TRACK, PAGE } from './constants'

export class OptimizelyWebClient {
  request: RequestClient
  settings: Settings

  constructor(request: RequestClient, settings: Settings) {
    ;(this.request = request), (this.settings = settings)
  }

  async getCustomEvents(type: Type) {
    const url =
      type === TRACK
        ? `https://api.optimizely.com/v2/events?per_page=100&include_classic=false&project_id=${this.settings.projectID}`
        : `https://api.optimizely.com/v2/pages?per_page=100&project_id=${this.settings.projectID}`

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
    category: string,
    type: Type,
    optEventProperties: OptEventProperties,
    edit_url?: string
  ) {
    const url =
      type === TRACK
        ? `https://api.optimizely.com/v2/projects/${this.settings.projectID}/custom_events`
        : `https://api.optimizely.com/v2/pages`

    if (!edit_url && type === PAGE) {
      throw new PayloadValidationError(`Page URL is required for Segment to create a page event in Optimizely`)
    }

    const json = {
      category,
      event_type: 'custom',
      key,
      name: key,
      event_properties: optEventProperties
        ? Object.keys(optEventProperties).map((key) => ({
            data_type: typeof optEventProperties[key],
            name: key
          }))
        : undefined,
      edit_url: type === PAGE && edit_url ? edit_url : undefined,
      project_id: type === PAGE ? this.settings.projectID : undefined
    }

    return await this.request<EventItemWithProps>(url, {
      method: 'POST',
      json: json as CreateEventJSON | CreatePageJSON,
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
