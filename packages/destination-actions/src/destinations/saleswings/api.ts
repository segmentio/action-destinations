export const apiBaseUrl = 'https://helium.saleswings.pro/api/core'

export type Event = TrackingEvent | PageVisitEvent

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
  values: ValueMap
  readonly type: string = 'tracking'

  public constructor(fields?: Partial<TrackingEvent>) {
    Object.assign(this, fields)
  }
}

export class PageVisitEvent {
  leadRefs: LeadRef[]
  url: string
  referrerUrl?: string
  userAgent?: string
  timestamp: number
  readonly type: string = 'page-visit'

  public constructor(fields?: Partial<PageVisitEvent>) {
    Object.assign(this, fields)
  }
}

export type Value = string | number | boolean
export type ValueMap = { [k: string]: Value }

export type LeadRefType = 'email' | 'client-id'

export type LeadRef = {
  type: LeadRefType
  value: string
}
