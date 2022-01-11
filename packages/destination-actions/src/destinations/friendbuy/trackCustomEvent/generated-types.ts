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
   * The user's customerId.
   */
  customerId: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The URL of the web page the event was generated on.
   */
  pageUrl?: string
  /**
   * The title of the web page the event was generated on.
   */
  pageTitle?: string
  /**
   * The browser's User-Agent string.
   */
  userAgent?: string
  /**
   * The users's IP address.
   */
  ipAddress?: string
}
