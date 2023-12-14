// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user identifier to associate the event with
   */
  userId: string
  /**
   * Name of the Segment track() event
   */
  event: string
  /**
   * A unique value for each event.
   */
  messageId?: string
  /**
   * Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z
   */
  timestamp: string
  /**
   * Additional information associated with the track() event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Company ID associated with the event
   */
  groupId?: {
    [k: string]: unknown
  }
}
