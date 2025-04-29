// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User identifier details to send to Optimizely.
   */
  user_identifiers: {
    /**
     * Segment Anonymous ID
     */
    anonymousId?: string
    /**
     * Segment User ID
     */
    userId?: string
    /**
     * User Email address. This is a required field
     */
    email: string
    /**
     * Optimizely VUID - user cookie generated created by Optimizely Javascript library
     */
    optimizely_vuid?: string
    /**
     * Feature Experimentation user ID
     */
    fs_user_id?: string
    /**
     * Web User ID
     */
    web_user_id?: string
  }
  /**
   * The name of the Optimizely Event Action.
   */
  event_action: string
  /**
   * The campaign name
   */
  campaign: string
  /**
   * The campaign unique identifier
   */
  campaign_id?: string
  /**
   * URL of the link which was clicked
   */
  link_url?: string
  /**
   * Event timestamp
   */
  timestamp: string
  /**
   * Enable batching of event data to Optimizely.
   */
  enable_batching?: boolean
  /**
   * Number of events to batch before sending to Optimizely.
   */
  batch_size?: number
}
