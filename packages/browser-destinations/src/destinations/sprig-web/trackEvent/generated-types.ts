// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event name that will be shown on Sprig's dashboard
   */
  name: string
  /**
   * Unique identifier for the user
   */
  userId?: string
  /**
   * Anonymous identifier for the user
   */
  anonymousId?: string
  /**
   * Object containing the properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
}
