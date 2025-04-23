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
     * User Email address
     */
    email?: string
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
   * The Optimizely Event Type. Defaults to "custom" if not provided
   */
  event_type?: string
  /**
   * The name of the Optimizely Event Action.
   */
  event_action?: string
  /**
   * Additional information to send with your custom event
   */
  data?: {
    [k: string]: unknown
  }
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
