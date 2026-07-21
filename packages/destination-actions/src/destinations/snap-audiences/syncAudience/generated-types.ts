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
   * Object that contains audience name and value.
   */
  props: {
    [k: string]: unknown
  }
  /**
   * If using phone as the identifier an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'phone' is configured as an additional identifier in the Audience settings tab.
   */
  phone?: string
  /**
   * The user's email address.
   */
  email?: string
  /**
   * If using Mobile Ad ID as the identifier an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'ios.idfa' is configured to 'ios_idfa' and 'android.idfa' is configured to 'android_idfa' in the Audience settings tab.
   */
  advertising_id?: string
  /**
   * When enabled, events will be batched before being sent to Snap.
   */
  enable_batching: boolean
  /**
   * Maximum number of API calls to include in a batch. Defaults to 100,000 which is the maximum allowed by Snap.
   */
  max_batch_size: number
  /**
   * The keys to use for batching the events. Ensures events from different audiences are sent in separate batches. This is Segment default behavior with Engage Audiences anyway.
   */
  batch_keys?: string[]
}
