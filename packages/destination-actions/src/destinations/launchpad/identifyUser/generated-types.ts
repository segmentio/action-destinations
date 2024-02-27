// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The IP address of the user. This is only used for geolocation and won't be stored.
   */
  ip?: string
  /**
   * A unique ID for a known user. This will be used as the Distinct ID. This field is required if the Anonymous ID field is empty
   */
  userId?: string
  /**
   * A unique ID for an anonymous user. This will be used as the Distinct ID if the User ID field is empty. This field is required if the User ID field is empty
   */
  anonymousId?: string
  /**
   * Properties that you want to set on the user profile and you would want to segment by later.
   */
  traits: {
    [k: string]: unknown
  }
}
