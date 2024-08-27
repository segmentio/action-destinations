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
