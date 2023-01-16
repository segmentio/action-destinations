// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Uniquely identifies a user instance of a web client.
   */
  client_id: string
  /**
   * A unique identifier for a user. See Google's [User-ID for cross-platform analysis](https://support.google.com/analytics/answer/9213390) and [Reporting: deduplicate user counts](https://support.google.com/analytics/answer/9355949?hl=en) documentation for more information on this identifier.
   */
  user_id?: string
  /**
   * A Unix timestamp (in microseconds) for the time to associate with the event. Segment will convert to Unix if not already converted. Events can be backdated up to 3 calendar days based on the property's timezone.
   */
  timestamp_micros?: string
  /**
   * The method used to login.
   */
  method?: string
  /**
   * The user properties to send to Google Analytics 4. You must create user-scoped dimensions to ensure custom properties are picked up by Google. See Google’s [Custom user properties](https://support.google.com/analytics/answer/9269570) to learn how to set and register user properties.
   */
  user_properties?: {
    [k: string]: unknown
  }
  /**
   * The amount of time a user interacted with your site, in milliseconds. Google only counts users who interact with your site for a non-zero amount of time. By default, Segment sets engagement time to 1 so users are counted.
   */
  engagement_time_msec?: number
  /**
   * The event parameters to send to Google Analytics 4.
   */
  params?: {
    [k: string]: unknown
  }
}
