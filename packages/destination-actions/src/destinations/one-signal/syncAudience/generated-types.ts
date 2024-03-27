// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience ID to which user identifier should be added or removed
   */
  computation_id: string
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  computation_key: string
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  computation_class: string
  /**
   * OneSignal Customer External ID value.
   */
  onsignal_external_id?: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
}
