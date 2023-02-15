// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for a user. See Google's [User-ID for cross-platform analysis](https://support.google.com/analytics/answer/9213390) and [Reporting: deduplicate user counts](https://support.google.com/analytics/answer/9355949?hl=en) documentation for more information on this identifier.
   */
  user_id?: string
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
   * The event parameters to send to Google Analytics 4.
   */
  params?: {
    [k: string]: unknown
  }
}
