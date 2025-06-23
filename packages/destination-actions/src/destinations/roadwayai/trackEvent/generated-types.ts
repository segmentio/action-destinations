// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, the action will use the RoadwayAI batch API.
   */
  enable_batching?: boolean
  /**
   * The distinct ID after calling identify.
   */
  user_id?: string
  /**
   * A distinct ID randomly generated prior to calling identify.
   */
  anonymous_id?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  group_id?: string
  /**
   * A random id that is unique to an event.
   */
  insert_id?: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string | number
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that provides useful context about the event.
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The name of the action being performed.
   */
  event: string
  /**
   * The Event Original Name, if applicable
   */
  name?: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * Application-specific properties and metadata
   */
  app_properties?: {
    /**
     * The name of your application.
     */
    app_name?: string
    /**
     * The current version of your application.
     */
    app_version?: string
  }
  /**
   * User location and locale information
   */
  location_properties?: {
    /**
     * The current country of the user.
     */
    country?: string
    /**
     * The current region of the user.
     */
    region?: string
    /**
     * The language set by the user.
     */
    language?: string
  }
  /**
   * Web page context and navigation information
   */
  page_properties?: {
    /**
     * The full URL of the webpage on which the event is triggered.
     */
    url?: string
    /**
     * Referrer URL
     */
    referrer?: string
  }
  /**
   * UTM tracking and campaign attribution properties
   */
  utm_properties?: {
    /**
     * The source of the campaign.
     */
    utm_source?: string
    /**
     * The medium of the campaign.
     */
    utm_medium?: string
    /**
     * The name of the campaign.
     */
    utm_campaign?: string
    /**
     * The term of the campaign.
     */
    utm_term?: string
    /**
     * The content of the campaign.
     */
    utm_content?: string
  }
}
