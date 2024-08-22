import { StateContext, RequestClient } from '@segment/actions-core'
import { OptimizelyPayload } from './types'
export interface EventItem {
    id: number
    key: string
}

interface CreateEventBody {
    key: string;
    name: string;
    category: string;
    event_type: string;
}
export class OptimizelyWebClient {
    request: RequestClient
    stateContext: StateContext
    projectID: string

    constructor(request: RequestClient, projectID: string, stateContext: StateContext) {
        this.request = request,
        this.stateContext = stateContext
        this.projectID = projectID
    }

    getEventFromCache(event_name: string): EventItem | undefined {
        return this.getEventsFromCache().find((event: EventItem) => event.key === event_name)
    }

    getEventsFromCache(): EventItem[] {
        return this.stateContext?.getRequestContext?.('events') as EventItem[] ?? []
    }

    async getEventFromOptimzely(event_name: string): Promise<EventItem | undefined> {
        const response = await this.request<EventItem[]>(`https://logx.optimizely.com/v1/events?per_page=100&page=1&include_classic=false&project_id=${this.projectID}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        })
        const events: EventItem[] | [] = await response.json()
        return events.find((event: EventItem) => event.key === event_name)
    }

    async createEvent(event_name: string, friendlyEventName: string, category: string): Promise<EventItem | undefined>{
        const response = await this.request<EventItem>(`https://api.optimizely.com/v2/projects/${this.projectID}/custom_events`, {
            method: 'POST',
            json: {
                key: event_name,
                name: friendlyEventName,
                category,
                event_type: 'custom'
            } as CreateEventBody,
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        })

        const event = await response.json()
        return event ?? undefined 
    }

    async updateCache(event: EventItem) {
        const events = this.getEventsFromCache()
        events.push(event)
        this.stateContext?.setResponseContext?.(`events`, String(events), {})
    }

    async sendEvent(body: OptimizelyPayload){
        return this.request('https://logx.optimizely.com/v1/events', {
            method: 'POST',
            json: body,
            headers: {
              'content-type': 'application/json',
              'accept': 'application/json'
            }
        })
    }
}
