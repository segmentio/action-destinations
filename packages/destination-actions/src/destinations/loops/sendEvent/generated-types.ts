// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Email address for the contact.
   */
  email?: string
  /**
   * Name of the event.
   */
  eventName: string
  /**
   * User ID for the contact.
   */
  userId: string
  /**
   * Optional properties that will be updated on the event's contact.
   */
  contactProperties?: {
    [k: string]: unknown
  }
  /**
   * Event-specific properties that can be included in emails triggered by this event.
   */
  eventProperties?: {
    [k: string]: unknown
  }
}
