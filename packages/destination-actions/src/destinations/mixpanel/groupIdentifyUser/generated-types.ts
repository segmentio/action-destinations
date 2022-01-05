// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The group key you specified in Mixpanel under Project settings. If this is not specified, it will be defaulted to "$group_id".
   */
  group_key?: string
  /**
   * The unique identifier of the group. If there is a trait that matches the group key, it will override this value.
   */
  group_id: string
  /**
   * The properties to set on the group profile.
   */
  traits?: {
    [k: string]: unknown
  }
}
