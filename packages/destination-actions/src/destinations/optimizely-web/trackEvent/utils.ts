import { StateContext } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'

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

interface Tag {
    revenue?: number
    value?: number
    quantity?: number
}

interface Event {
    entity_id: number
    key?: string
    timestamp: string | number
    uuid: string
    type: string
    tags: Tag
    properties: { [key: string]: unknown }
}

interface Snapshot {
    decisions: []
    events: Event[]
}

interface Visitor {
    visitor_id: string
    attributes: []
    snapshots: Snapshot[]
}

export interface Body {
    account_id: string
    visitors: Visitor[]
    anonymize_ip: boolean
    client_name: string
    client_version: string
    enrich_decisions: boolean
}
export class OptimizelyWebClient {
    request: RequestClient
    stateContext: StateContext

    constructor(request: RequestClient, stateContext: StateContext) {
        this.request = request,
        this.stateContext = stateContext
    }

    async updateCachedEventNames(projectID: string) {
        const response = await this.request<EventItem[]>(`https://logx.optimizely.com/v1/events?per_page=100&page=1&include_classic=false&project_id=${projectID}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        })

        const events = await response.json()
        this.setCacheEvents(events)
    }

    setCacheEvents(events: EventItem[]) {
        this.stateContext?.setResponseContext?.(`events`, String(events), {})
    }

    getEventIdFromCache(eventName: string) {
        return (this.stateContext?.getRequestContext?.('events') as EventItem[]).find((event: EventItem) => event.key === eventName)?.id
    }

    async createEvent(projectID: string, eventName: string, friendlyEventName: string) {
        const response = await this.request<EventItem>(`https://api.optimizely.com/v2/projects/${projectID}/custom_events`, {
            method: 'POST',
            json: {
                key: eventName,
                name: friendlyEventName,
                category: 'other',
                event_type: 'custom'
            } as CreateEventBody,
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        })

        return response.json()
    }

    async sendEvent(body: Body){
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
