// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Braze campaign to trigger. The campaign must be an API-triggered campaign created in Braze.
   */
  campaign_id: string
  /**
   * Optional string to identify the send. This can be used for send level analytics, or to cancel a send.
   */
  send_id?: string
  /**
   * Optional data that will be used to personalize the campaign message. Personalization key-value pairs that will apply to all users in this request.
   */
  trigger_properties?: {
    [k: string]: unknown
  }
  /**
   * Must be set to true when sending a message to an entire segment that a campaign targets.
   */
  broadcast?: boolean
  /**
   * An array of user identifiers to send the campaign to.
   */
  recipients?: {
    /**
     * The external ID of the user to send the campaign to.
     */
    external_user_id?: string
    /**
     * A user alias object to identify the user.
     */
    user_alias?: {
      alias_name?: string
      alias_label?: string
    }
    /**
     * The Braze user identifier.
     */
    braze_id?: string | null
  }[]
  /**
   * A standard audience object to specify the users to send the campaign to.
   */
  audience?: {
    [k: string]: unknown
  }
  /**
   * The ID of the segment to send the campaign to.
   */
  segment_id?: string
  /**
   * The ID of the Connected Audience to send the campaign to.
   */
  audience_id?: string
}
