import { StateContext, RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { EventItem, CreateEventJSON, CreatePageJSON, SendEventJSON, Type } from './types'
import { PayloadValidationError } from '@segment/actions-core/*'

export class OptimizelyWebClient {
  request: RequestClient
  settings: Settings
  projectID: string
  stateContext?: StateContext

  constructor(request: RequestClient, settings: Settings, projectID: string, stateContext?: StateContext) {
    this.request = request, 
    this.stateContext = stateContext,
    this.projectID = projectID,
    this.settings = settings
  }

  async getCustomEvents(type: Type) {
    const url = type === 'track' ? `https://api.optimizely.com/v2/events?per_page=100&include_classic=false&project_id=${this.projectID}` : `https://api.optimizely.com/v2/pages?per_page=100&project_id=${this.projectID}`
    return await this.request<EventItem[]>(
      url,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.settings.optimizelyApiKey}`
        }
      }
    )
  }

  async createCustomEvent(idType: string, idValue: string, category: string, type: Type, edit_url?: string) {
    
    const url = type === 'track' ? `https://api.optimizely.com/v2/projects/${this.projectID}/custom_events` : `https://api.optimizely.com/v2/pages`
    
    if(!edit_url && type === 'page') {
      throw new PayloadValidationError(`Page URL is required for Segment to create a page event in Optimizely`)
    } 

    const json = {
      key: idType==='key' ? idValue : undefined,
      name: idType==='name' ? idValue : undefined,
      category,
      event_type: 'custom', 
      edit_url: type==='page' && edit_url ? edit_url : undefined,
      project_id: type==='page' ? this.projectID : undefined 
    }

    return await this.request<EventItem>(
      url,
      {
        method: 'POST',
        json : json as CreateEventJSON | CreatePageJSON,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.settings.optimizelyApiKey}`
        }
      }
    )
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


