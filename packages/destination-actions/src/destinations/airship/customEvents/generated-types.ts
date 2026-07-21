// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User. Provide either this or Channel ID.
   */
  named_user_id?: string
  /**
   * Airship Channel ID. Provide either this or Named User ID.
   */
  channel_id?: string
  /**
   * The Airship audience key for the channel type (e.g. android_channel, ios_channel, amazon_channel, web_channel). If omitted, the generic channel key is used and Airship will resolve the type, which may introduce a slight delay.
   */
  channel_type?: string
  /**
   * Event Name
   */
  name: string
  /**
   * When the event occurred.
   */
  occurred: string | number
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If true, Segment will batch events before sending to Airship. Limit 100 events per request.
   */
  enable_batching?: boolean
}
