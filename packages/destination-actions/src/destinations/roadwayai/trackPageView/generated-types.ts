// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, the action will use the RoadwayAI batch API.
   */
  enable_batching?: boolean
  /**
   * UTM tracking and campaign attribution properties
   */
  utm_properties?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
  /**
   * The ID used to uniquely identify a person in RoadwayAI.
   */
  id?: string
  /**
   * An anonymous ID for when no Person ID exists.
   */
  anonymous_id?: string
  /**
   * An optional identifier used to deduplicate events.
   */
  event_id?: string
  /**
   * The URL of the page visited.
   */
  url: string
  /**
   * The page referrer
   */
  referrer?: string | null
  /**
   * A timestamp of when the event took place. Default is current date and time.
   */
  timestamp?: string
  /**
   * Optional data to include with the event.
   */
  data?: {
    [k: string]: unknown
  }
}
