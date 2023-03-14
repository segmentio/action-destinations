// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user to send events for. Required if anonymousId is not provided
   */
  userId?: string
  /**
   * The anonymous ID of the user to send events for. Required if userId is not provided
   */
  anonymousId?: string
  /**
   * The ID of the account to send events for
   */
  accountId?: string
  /**
   * The name of the event to send
   */
  eventName: string
  /**
   * The timestamp of the event
   */
  timestamp: string | number
  /**
   * The properties of the event
   */
  eventProperties?: {
    [k: string]: unknown
  }
}
