// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of the event to track.
   */
  eventType: string
  /**
   * Object containing the properties for the event being tracked. All of the fields in this object will be sent in the root of the Friendbuy track event.
   */
  eventProperties: {
    [k: string]: unknown
  }
  /**
   * An identifier for the event being tracked to prevent the same event from being rewarded more than once.
   */
  deduplicationId?: string
  /**
   * The user's customer ID.
   */
  customerId: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The user's email address.
   */
  email?: string
}
