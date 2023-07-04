// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event
   */
  eventName: string
  /**
   * The time when this event occurred. If this isn't set, the current time will be used.
   */
  timestamp: string | number
  /**
   * User ID, ideally mappable to external ref of a Rev User.
   */
  userId: string
  /**
   * The email of the contact associated with this event.
   */
  email?: string
  /**
   * A json object containing additional information about the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The Segment messageId
   */
  messageId?: string
  /**
   * Event context as it appears in Segment
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The anonymous ID associated with the user
   */
  anonymousId?: string
}
