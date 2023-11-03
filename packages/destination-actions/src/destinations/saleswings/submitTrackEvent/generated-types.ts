// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Type of the SalesWings custom event (a custom event is visualized in SalesWings cockpit and SalesForce Lead Intent View as "[[Kind]] Data").
   */
  kind: string
  /**
   * String description of the SalesWings custom event payload (a custom event is visualized in SalesWings cockpit and SalesForce Lead Intent View as "[[Kind]] Data").
   */
  data: string
  /**
   * Permanent identifier of a Segment user the event is attributed to.
   */
  userID?: string
  /**
   * A pseudo-unique substitute for a Segment user ID the event is attributed to.
   */
  anonymousID?: string
  /**
   * Identified email of the Segment User.
   */
  email?: string
  /**
   * URL associated with the event.
   */
  url?: string
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
  /**
   * Custom attribute values associated with the SalesWings custom event.
   */
  values?: {
    [k: string]: unknown
  }
}
