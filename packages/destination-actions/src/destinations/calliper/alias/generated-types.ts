// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.
   */
  time?: string | number
  /**
   * A new user id to be merged with the original distinct id. Each alias can only map to one distinct id.
   */
  new_id?: string | null
  /**
   * A previous user id to be merged with the alias.
   */
  previous_id?: string
}
