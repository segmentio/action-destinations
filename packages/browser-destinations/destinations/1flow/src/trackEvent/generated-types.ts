export interface Payload {
  /**
   * Event to be tracked
   */
  event_name: string
  /**
   * Object containing the attributes (properties) of the event
   */
  properties?: {
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
