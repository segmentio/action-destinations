// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.
   */
  time?: string | number
  /**
   * The unique identifier of the group.
   */
  group_id: string
  /**
   * The properties to set on the group profile.
   */
  traits?: {
    [k: string]: unknown
  }
}
