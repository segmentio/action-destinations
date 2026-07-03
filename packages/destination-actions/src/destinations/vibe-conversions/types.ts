import type { EVENT_TYPES } from './constants'

export type EventType = typeof EVENT_TYPES[number]

// Request body sent to the Vibe conversion endpoint.
export interface ConversionEventRequest {
  // Action / event type that was performed.
  a: EventType
  // Unique event ID (defaults to Segment messageId).
  eid: string
  // Vibe pixel ID associated with the advertiser (from settings).
  aid: string
  // UNIX timestamp of the event in milliseconds.
  ts?: number
  // IP address of the user (IPv4). Required if `em` is absent.
  ip?: string
  // User email address. Required if `ip` is absent.
  em?: string
  // Event data serialized to a JSON string.
  ed?: string
  // Google Analytics ID for cross-platform attribution.
  gid?: string
  // User Agent string.
  ua?: string
  // Page URL where the action occurred.
  url?: string
}

// The Vibe conversion endpoint acknowledges receipt; it returns no meaningful body.
export interface ConversionEventResponse {
  status?: string
}
