// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The group key. If this is not set, it is defaulted to "name".
   */
  group_key?: string
  /**
   * Properties to set on the group profile. Make sure to have a field that corresponds to the above group key.
   */
  traits?: {
    [k: string]: unknown
  }
}
