// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the group.
   */
  group_id?: string
  /**
   * The group key you specified in Mixpanel under Project settings. If this is not specified, this is defaulted to "$group_id".
   */
  group_key?: string
  /**
   * The properties to set on the group profile.
   */
  traits?: {
    [k: string]: unknown
  }
}
