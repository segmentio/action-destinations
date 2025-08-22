// TypeScript interfaces for InsightTracker destination API

export interface UserIdentity {
  /**
   * Unique user identifier
   */
  user_id?: string
  /**
   * Anonymous user identifier
   */
  anonymous_id?: string
  /**
   * User's email address
   */
  email?: string
  /**
   * User's phone number
   */
  phone?: string
}

export interface EventProperties {
  /**
   * Additional event properties
   */
  [key: string]: unknown
}

export interface UserTraits {
  /**
   * User's first name
   */
  first_name?: string
  /**
   * User's last name
   */
  last_name?: string
  /**
   * User's age
   */
  age?: number
  /**
   * User's subscription status
   */
  is_subscribed?: boolean
  /**
   * Additional user traits
   */
  [key: string]: unknown
}

export interface DeviceInfo {
  /**
   * Device type (mobile, desktop, tablet)
   */
  type?: string
  /**
   * Operating system
   */
  os?: string
  /**
   * Browser name
   */
  browser?: string
  /**
   * Screen resolution
   */
  screen_resolution?: string
}

export interface LocationInfo {
  /**
   * User's city
   */
  city?: string
  /**
   * User's country
   */
  country?: string
  /**
   * User's region/state
   */
  region?: string
  /**
   * User's IP address
   */
  ip_address?: string
}

/**
 * Main request interface for sending events to InsightTracker
 */
export interface InsightTrackerEventRequest {
  /**
   * Type of event (track, page, identify)
   */
  event_type: 'track' | 'page' | 'identify'
  /**
   * Name of the event (for track events)
   */
  event_name?: string
  /**
   * Page name (for page events)
   */
  page_name?: string
  /**
   * Page category (for page events)
   */
  page_category?: string
  /**
   * User identity information
   */
  user: UserIdentity
  /**
   * User traits (for identify events or context)
   */
  traits?: UserTraits
  /**
   * Event properties
   */
  properties?: EventProperties
  /**
   * Device information
   */
  device?: DeviceInfo
  /**
   * Location information
   */
  location?: LocationInfo
  /**
   * Event timestamp (ISO 8601 format)
   */
  timestamp: string
  /**
   * Unique message identifier
   */
  message_id: string
  /**
   * Session identifier
   */
  session_id?: string
}

/**
 * Response interface from InsightTracker API
 */
export interface InsightTrackerEventResponse {
  /**
   * Success status
   */
  success: boolean
  /**
   * Response message
   */
  message: string
  /**
   * Event ID assigned by InsightTracker
   */
  event_id?: string
  /**
   * Any validation errors
   */
  errors?: string[]
}