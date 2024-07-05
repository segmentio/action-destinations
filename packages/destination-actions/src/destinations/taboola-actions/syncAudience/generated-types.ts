// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Audience ID from Taboola.
   */
  external_audience_id: string
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  segment_computation_key: string
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * The user's email address
   */
  user_email?: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * When enabled, events will be batched before being sent to Taboola. In most cases, batching should be enabled.
   */
  enable_batching: boolean
  /**
   * To send iOS and Android Device IDs, include the 'ios.id' and 'android.id' Identifiers from the 'Customized Setup' option when connecting your Audience.
   */
  device_id?: string
  /**
   * Max Batch size to send to Taboola.
   */
  batch_size: number
  /**
   * Action to perform on the audience.
   */
  action?: string
}
