export interface OptimizelyPayload {
  account_id: string
  anonymize_ip: boolean
  client_name: 'Segment Optimizely Web Destination'
  client_version: string
  enrich_decisions: true
  visitors: Array<Visitor>
}

export interface Visitor {
  visitor_id: string
  attributes: [] // should be empty array
  snapshots: Array<Snapshot>
}

export interface Snapshot {
  decisions: [] // should be empty array
  events: Array<Event>
}

export interface Event {
  entity_id: string
  key: string
  timestamp: UnixTimestamp13
  uuid: string
  type: EventType
  tags: {
    revenue?: number
    value?: number
    quantity?: number
    currency?: string
    $opt_event_properties?: {
      [key: string]: string | number | boolean
    }
    [key: string]: string | number | { [key: string]: string | number | boolean } | undefined
  }
}

export type EventType = 'view_activated' | 'other'

export type UnixTimestamp13 = number & { __type: 'UnixTimestamp13' }

export interface EventItem {
  id: number
  key: string
  name: string
}

export interface CreateEventBase {
  category: string
  event_type: string
}

export type CreateEventJSON = ( 
  | { key: string; name?: never }
  | { name: string; key?: never }
) & CreateEventBase

export interface CreatePageBase {
  edit_url: string
  project_id: string
  category: string
  event_type: string
}

export type CreatePageJSON = ( 
  | { key: string; name?: never }
  | { name: string; key?: never }
) & CreatePageBase


export type Type = 'track' | 'page'  