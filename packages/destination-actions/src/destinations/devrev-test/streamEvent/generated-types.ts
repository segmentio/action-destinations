// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the occured event
   */
  eventName: string
  /**
   * The time when this event occurred. If this isn't set, the current time will be used.
   */
  occurredAt: string | number
  /**
   * The email of the contact associated with this event.
   */
  email?: string
  /**
   * User ID, ideally mappable to external ref of a Rev User.
   */
  userId: string
  /**
   * A json object containing additional information about the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
