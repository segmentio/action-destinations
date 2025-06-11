/**
 * TypeScript request types for RoadwayAI API endpoints
 * These define the exact JSON structure your API receives
 */

/**
 * Request payload for POST /api/v1/segment/events/track
 * After flattening object fields to individual properties
 */
export interface TrackEventRequest {
  event: string
  distinct_id?: string
  anonymous_id?: string
  user_id?: string
  group_id?: string
  insert_id?: string
  timestamp?: string | number
  app_name?: string
  app_version?: string
  country?: string
  region?: string
  language?: string
  url?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  name?: string
  event_properties?: Record<string, unknown>
  context?: Record<string, unknown>
  batch_size?: number
  enable_batching?: boolean
}

/**
 * Request payload for POST /api/v1/segment/events/identify
 */
export interface IdentifyUserRequest {
  timestamp?: string
  ip?: string
  user_id?: string | null
  anonymous_id?: string | null
  traits?: Record<string, unknown>
  enable_batching?: boolean
}

/**
 * Request payload for POST /api/v1/segment/events/group
 */
export interface GroupUserRequest {
  user_id?: string
  anonymous_id?: string
  group_id?: string
  group_name?: string
  timestamp: string
  traits?: Record<string, unknown>
  context?: Record<string, unknown>
  enable_batching?: boolean
}

/**
 * Request payload for POST /api/v1/segment/events/page
 */
export interface TrackPageViewRequest {
  id?: string
  anonymous_id?: string
  event_id?: string
  url: string
  referrer?: string | null
  timestamp?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  data?: Record<string, unknown>
  enable_batching?: boolean
}
