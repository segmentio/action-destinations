// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * For regular analytics events, use `track`. For page views, use `page`. For mobile screens, use `screen`.
   */
  eventType: string
  /**
   * The name of the event to track
   */
  event: string
  /**
   * The ID of the user
   */
  userId: string
  /**
   * The anonymous ID of the user
   */
  anonymousId: string
  /**
   * The context properties to send with the event
   */
  context: {
    [k: string]: unknown
  }
  /**
   * The properties of the event
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp: string | number
}
