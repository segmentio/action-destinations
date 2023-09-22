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
  }
  /**
   * The name of the Optimizely event to send
   */
  event_action: string
  /**
   * The campaign unique identifier
   */
  campaign_id?: string
  /**
   * The campaign name
   */
  campaign: string
  /**
   * URL of the link which was clicked
   */
  link_url?: string
  /**
   * Event timestamp
   */
  timestamp: string
}
