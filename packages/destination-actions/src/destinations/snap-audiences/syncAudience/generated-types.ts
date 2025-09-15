// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Audience key.
   */
  audienceKey: string
  /**
   * A computed object for track events.
   */
  props: {
    [k: string]: unknown
  }
  /**
   * Choose the type of identifier to use when adding users to Snap.
   */
  schema_type: string
  /**
   * If using phone as the identifier, an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'phone' is configured as an additional identifier in the Audience settings tab.
   */
  phone?: string
  /**
   * The user's email address.
   */
  email?: string
  /**
   * If using Mobile Ad ID as the identifier, an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'ios.idfa' and 'android.idfa' are configured as an additional identifier in the Audience settings tab.
   */
  advertising_id?: string
  /**
   * When enabled, events will be batched before being sent to Snap.
   */
  enable_batching: boolean
}
