import type { JSONLikeObject } from '@segment/actions-core'

export type ItemStatus = 'inserted' | 'duplicate' | 'error' | 'rejected'

export interface EventsApiResponse {
  data?: {
    inserted?: number
    duplicates?: number
    errors?: number
    results?: Array<{ status: ItemStatus; reason?: string }>
  }
  validation_errors?: Array<{ index: number; error: string }>
}

export interface GainTraceEvent extends JSONLikeObject {
  event_name: string
  event_category: string
  source: 'segment'
  source_event_id: string
  timestamp: string
  user_id?: string
  anonymous_id?: string
  properties?: JSONLikeObject
}

export interface EventSource {
  messageId?: string
  timestamp?: string | number
  eventName?: string
  eventCategory?: string
  userId?: string
  anonymousId?: string
  properties?: Record<string, unknown>
}
