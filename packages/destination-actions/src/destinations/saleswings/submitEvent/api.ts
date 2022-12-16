export type Event = TrackingEvent | PageViewEvent

export type EventBatch = {
  events: Event[]
}

export class TrackingEvent {
  leadRefs: LeadRef[]
  kind: string
  data: string
  url?: string
  referrerUrl?: string
  userAgent?: string
  timestamp: number
  values: Map<string, Value>
  readonly type: string = 'tracking'

  public constructor(fields?: Partial<TrackingEvent>) {
    Object.assign(this, fields)
  }
}

export class PageViewEvent {
  leadRefs: Array<LeadRef>
  url: string
  referrerUrl?: string
  userAgent?: string
  timestamp: number
  readonly type: string = 'pageView'

  public constructor(fields?: Partial<PageViewEvent>) {
    Object.assign(this, fields)
  }
}

export type Value = string | number | boolean

export type LeadRefType = 'email' | 'clientID'

export class LeadRef {
  type: LeadRefType
  value: string
}
