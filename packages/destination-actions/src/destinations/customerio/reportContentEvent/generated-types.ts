// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID for the anonymous user.
   */
  anonymous_id?: string
  /**
   * The type of content event.
   */
  actionType: string
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
  /**
   * Convert dates to Unix timestamps (seconds since Epoch).
   */
  convert_timestamp?: boolean
}
