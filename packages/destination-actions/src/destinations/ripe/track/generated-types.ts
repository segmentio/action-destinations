// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The anonymized user id
   */
  anonymousId?: string | null
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * The group id
   */
  groupId?: string
  /**
   * The event name
   */
  event: string
  /**
   * Properties to send with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp?: string | number
}
