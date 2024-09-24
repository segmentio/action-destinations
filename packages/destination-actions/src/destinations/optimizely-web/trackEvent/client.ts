import { StateContext, RequestClient, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { OptimizelyPayload } from './types'
import { Settings } from '../generated-types'
import { TRACK } from './constants'
import { Payload } from './generated-types'

export interface CreateResp {
  id: number
  key: string
  name: string
}

interface CreateEventBody {
  key: string
  name: string
  category: string
  event_type: string
}

interface CreatePageBody {
  archived: false
  edit_url: string
  project_id: string
  key: string
  name: string
  category: string
  event_type: string
}

export class OptimizelyWebClient {
  request: RequestClient
  settings: Settings
  projectID: string
  stateContext?: StateContext | undefined

  constructor(request: RequestClient, settings: Settings, projectID: string, stateContext: StateContext | undefined) {
    ;(this.request = request), (this.stateContext = stateContext)
    this.projectID = projectID
    this.settings = settings
  }

  getEventFromCache(type: string, value: string): CreateResp | undefined {
    return this.getEventsFromCache().find((event: CreateResp) => {      
      return (type==='key' && event.key === value) || (type==='name' && event.name === value)
    })
  }

  getEventsFromCache(): CreateResp[] {
    return (this.stateContext?.getRequestContext?.('events') as CreateResp[]) ?? []
  }

  async getPageEventFromOptimzely(idType: string, idValue: string): Promise<CreateResp | undefined> {
    const response = await this.request<CreateResp[]>(
      `https://api.optimizely.com/v2/pages?per_page=100&project_id=${this.projectID}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.settings.optimizelyApiKey}`
        }
      }
    )
    const events: CreateResp[] | [] = await response.json()

    return events.find((page: CreateResp) => {
      return (idType==='key' && page.key === idValue) || (idType==='name' && page.name === idValue)
    })

  }

  async getCustomEventFromOptimzely(idType: string, idValue: string): Promise<CreateResp | undefined> {
    const response = await this.request<CreateResp[]>(
      `https://api.optimizely.com/v2/events?per_page=100&page=1&include_classic=false&project_id=${this.projectID}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.settings.optimizelyApiKey}`
        }
      }
    )
    const events: CreateResp[] | [] = await response.json()

    return events.find((event: CreateResp) => {
      return (idType==='key' && event.key === idValue) || (idType==='name' && event.name === idValue)
    })
  }

  async createCustomEvent(idType: string, idValue: string, category: string): Promise<CreateResp | undefined> {
    const response = await this.request<CreateResp>(
      `https://api.optimizely.com/v2/projects/${this.projectID}/custom_events`,
      {
        method: 'POST',
        json: {
          key: idType==='key' ? idValue : undefined,
          name: idType==='name' ? idValue : undefined,
          category,
          event_type: 'custom'
        } as CreateEventBody,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.settings.optimizelyApiKey}`
        }
      }
    )

    const event = await response.json()
    return event ?? undefined
  }

  async createPageEvent(idType: string, idValue: string, category: string, edit_url: string): Promise<CreateResp | undefined> {
    const response = await this.request<CreateResp>(
      `https://api.optimizely.com/v2/pages`,
      {
        method: 'POST',
        json: {
          edit_url,
          project_id: this.projectID,
          key: idType==='key' ? idValue : undefined,
          name: idType==='name' ? idValue : undefined,
          category,
          event_type: 'custom'
        } as CreateEventBody,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${this.settings.optimizelyApiKey}`
        }
      }
    )

    const event = await response.json()
    return event ?? undefined
  }
  

  async updateCache(event: CreateResp) {
    const events = this.getEventsFromCache()
    events.push(event)
    this.stateContext?.setResponseContext?.(`events`, String(events), {})
  }

  async sendEvent(body: OptimizelyPayload) {
    return this.request('https://logx.optimizely.com/v1/events', {
      method: 'POST',
      json: body,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      }
    })
  }

  getIdentifier(eventKey?: string, eventName?: string): {idType: string, idValue: string} {
    if(!eventKey && !eventName) {
      throw new IntegrationError(`Event Key or Event Name is required if eventId not provided`, 'EVENT_IDENTIFIER_REQUIRED', 400)
    }
    const idType = eventKey ? 'key' : 'name'
    const idValue = eventKey ?? eventName as string
    return { idType, idValue }
  }


  async ensureEvent(idType: string, idValue: string, category: string): Promise<CreateResp>{
    let event =  await this.getCustomEventFromOptimzely(idType, idValue)
    if (typeof event === undefined) {
      event = await this.createCustomEvent(idType, idValue, category)
      await this.updateCache(event)
    }
    if (!event) {
      throw new IntegrationError(
        `Enable to create event with event ${idType} = ${idValue} in Optimizely`,
        'EVENT_CREATION_ERROR',
        400
      )
    }
    return event 
  }

  async ensurePage(idType: string, idValue: string, category: string, pageUrl?: string): Promise<CreateResp>{
    let event =  await this.getPageEventFromOptimzely(idType, idValue)
    if (typeof event === undefined) {
      if(!pageUrl) {
        throw new PayloadValidationError(`Page URL is required for Segment to create a page event in Optimizely`)
      }
      event = await this.createPageEvent(idType, idValue, category, pageUrl)
      await this.updateCache(event)
    }
    if (!event) {
      throw new IntegrationError(
        `Enable to create page with page ${idType} = ${idValue} in Optimizely`,
        'EVENT_CREATION_ERROR',
        400
      )
    }
    return event
  }



  async getEventid(payload: Payload): Promise<string> {

    const {
      category,
      eventMatching: { createEventIfNotFound, eventName, eventKey },
      eventType,
      pageUrl
    } = payload

    const { idType, idValue } = this.getIdentifier(eventKey, eventName)

    let event = this.getEventFromCache(idType, idValue)

    if (typeof event === undefined) {
      if(createEventIfNotFound === 'CREATE'){
        event = eventType === TRACK ? await this.ensureEvent(idType, idValue, category) : await this.ensurePage(idType, idValue, category, pageUrl)
      } else {
        throw new PayloadValidationError(`Event with ${idType} = ${idValue} not found in Optimizely. "Create If Not Found" field set to "Do not create" which prevents Segment from creating the event.`)
      }
    } 

    if(!event) {
      throw new PayloadValidationError(`Error attempting to find event with ${idType} = ${idValue} in Optimizely`)
    }

    return event.id.toString()
  }
}
