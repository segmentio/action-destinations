// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Control how Segment Track events are mapped to SalesWings custom events. In SalesWings, custom events are displayed and evaluated in the Rule Engine as "[[Name]] Payload", where "Name" is the name of the event and "Payload" is a string representing any event specific information. SalesWings Falcon Engine allows you to define rules based on this representation. To control how it is formed, provide the Segment Track event name on the left-hand side and the Track event property name on the right side. For example, Segment Track event "User Registered" with property "plan" set to "Pro Annual" will be formatted as SalesWings custom event "[[User Registered]] Pro Annual" if you configure "User Registered" on the left-side and "plan" on the right side.
   */
  customEventPropertyMapping?: {
    [k: string]: unknown
  }
  /**
   * Permanent identifier of a Segment user the event is attributed to.
   */
  userId?: string
  /**
   * A pseudo-unique substitute for a Segment user ID the event is attributed to.
   */
  anonymousId?: string
  /**
   * Identified email of the Segment User.
   */
  email?: string
  /**
   * Type of the event.
   */
  type?: string
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
   * Name of the Track event.
   */
  eventName?: string
  /**
   * Screen name of the Screen event.
   */
  screenName?: string
  /**
   * Properties of the Track event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Traits of the Identify event.
   */
  traits?: {
    [k: string]: unknown
  }
}
