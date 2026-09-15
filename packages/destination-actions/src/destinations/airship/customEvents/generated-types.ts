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
   * The device type for the Channel ID (e.g. ios, android, amazon, web). Defaults to the device type from the event. If omitted or unrecognized, the generic channel key is used and Airship resolves the type, which may introduce a slight delay.
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
