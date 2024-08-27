import { StateContext, RequestClient, IntegrationError } from '@segment/actions-core'
import { OptimizelyPayload } from './types'
import { Settings } from '../generated-types'
export interface EventItem {
  id: number
  key: string
}

interface CreateEventBody {
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

  getEventFromCache(event_name: string): EventItem | undefined {
    return this.getEventsFromCache().find((event: EventItem) => event.key === event_name)
  }

  getEventsFromCache(): EventItem[] {
    return (this.stateContext?.getRequestContext?.('events') as EventItem[]) ?? []
  }

  async getCustomEventFromOptimzely(event_name: string): Promise<EventItem | undefined> {
    const response = await this.request<EventItem[]>(
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
    const events: EventItem[] | [] = await response.json()

    return events.find((event: EventItem) => event.key === event_name)
  }

  async createCustomEvent(
    event_name: string,
    friendlyEventName: string,
    category: string
  ): Promise<EventItem | undefined> {
    const response = await this.request<EventItem>(
      `https://api.optimizely.com/v2/projects/${this.projectID}/custom_events`,
      {
        method: 'POST',
        json: {
          key: event_name,
          name: friendlyEventName,
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

  async updateCache(event: EventItem) {
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

  async getEventid(
    event_name: string,
    eventType: 'page' | 'track',
    category: string,
    friendlyEventName: string,
    createEventIfNotFound: string
  ): Promise<string> {
    let event = this.getEventFromCache(event_name)

    if (typeof event === 'undefined' && createEventIfNotFound !== 'DO_NOT_CREATE') {
      event =
        eventType === 'page'
          ? await this.getPageEventFromOptimzely(event_name)
          : await this.getCustomEventFromOptimzely(event_name)

      if (typeof event === 'undefined') {
        event =
          eventType === 'page'
            ? await this.createPageEvent(event_name, friendlyEventName, category)
            : await this.createCustomEvent(event_name, friendlyEventName, category)
        if (!event) {
          throw new IntegrationError(
            `Enable to create event with name ${event_name} in Optimizely`,
            'EVENT_CREATION_ERROR',
            400
          )
        }
        await this.updateCache(event)
      }
    }

    if (typeof event === 'undefined') {
      throw new IntegrationError(`Event with name ${event_name} not found`, 'EVENT_NOT_FOUND', 400)
    }

    return event.id.toString()
  }
}
