import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { EventItem, CreateEventJSON, CreatePageJSON, SendEventJSON, Type } from './types'
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

  async createCustomEvent(key: string, name: string, category: string, type: Type, edit_url?: string) {
    const url =
      type === TRACK
        ? `https://api.optimizely.com/v2/projects/${this.settings.projectID}/custom_events`
        : `https://api.optimizely.com/v2/pages`

    if (!edit_url && type === PAGE) {
      throw new PayloadValidationError(`Page URL is required for Segment to create a page event in Optimizely`)
    }

    const json = {
      key,
      name: name,
      category,
      event_type: 'custom',
      edit_url: type === PAGE && edit_url ? edit_url : undefined,
      project_id: type === PAGE ? this.settings.projectID : undefined
    }

    return await this.request<EventItem>(url, {
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
