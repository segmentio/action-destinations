// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Event to be tracked
   */
  event: string
  /**
   * Object containing the attributes (properties) of the event
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * Unique identifer of the user
   */
  userId?: string
  /**
   * Anonymous identifier of the user
   */
  anonymousId?: string
}
