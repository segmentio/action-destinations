// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Permanent identifier of a Segment user the event is attributed to.
   */
  userId?: string
  /**
   * A pseudo-unique substitute for a Segment user ID the event is attributed to.
   */
  anonymousId?: string
  /**
   * URL associated with the event.
   */
  url: string
  /**
   * Referrer URL associated with the event.
   */
  referrerUrl?: string
  /**
   * User Agent associated with the event.
   */
  userAgent?: string
  /**
   * When the event was sent.
   */
  timestamp?: string | number
}
