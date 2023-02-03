// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The group key you specified in Launchpad under the company corresponding to the group. If this is not specified, it will be defaulted to "$group_id". This is helpful when you have a group of companies that should be joined together as in when you have a multinational.
   */
  groupKey?: string
  /**
   * The unique identifier of the group. If there is a trait that matches the group key, it will override this value.
   */
  groupId: string
  /**
   * The properties to set on the group profile.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The unique user identifier set by you
   */
  userId?: string | null
  /**
   * The generated anonymous ID for the user
   */
  anonymousId?: string | null
}
