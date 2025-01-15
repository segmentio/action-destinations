import { Payload } from './generated-types'

export type UnixTimestamp13 = number & { __type: 'UnixTimestamp13' }

export interface OptEventProperties {
  [key: string]: string | number | boolean
}

export interface ValidPayload extends Payload {
  unixTimestamp13: UnixTimestamp13
  optEventProperties?: OptEventProperties
  key: string | undefined
}

export interface SendEventJSON {
  account_id: string
  project_id?: number
  anonymize_ip: boolean
  client_name: 'twilio_segment/optimizely_web_destination'
  client_version: string
  enrich_decisions: true
  visitors: Array<Visitor>
}

export interface Visitor {
  visitor_id: string
  session_id?: string
  attributes: [] // should be empty array
  snapshots: Array<Snapshot>
}

export interface Snapshot {
  decisions: [] // should be empty array
  events: Array<Event>
}

export interface Event {
  entity_id: string
  key?: string
  quantity?: number
  revenue?: number
  tags: {
    $opt_event_properties?: OptEventProperties
    [key: string]: string | number | { [key: string]: string | number | boolean } | undefined
  }
  timestamp: UnixTimestamp13
  type: 'other'
  uuid: string
  value?: number
}

export interface EventItem {
  id: number
  key: string
  name: string
}

export type EventProperties = Array<{
  data_type: 'string' | 'boolean' | 'number'
  name: string
}>

export interface EventItemWithProps extends EventItem {
  event_properties: EventProperties
}

export interface CreateEventJSON {
  category: string
  event_type: string
  key: string
  name?: string
  event_properties?: Array<{
    data_type: 'string' | 'boolean' | 'number'
    name: string
  }>
}