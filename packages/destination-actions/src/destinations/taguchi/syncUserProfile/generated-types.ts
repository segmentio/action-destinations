// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * At least one identifier is required. Any identifiers sent will then become required for future updates to that Subscriber.
   */
  identifiers: {
    /**
     * A unique identifier for the Subscriber.
     */
    ref?: string
    /**
     * Email address of the Subscriber.
     */
    email?: string
  }
  /**
   * Standard traits for the Subscriber. All text fields. No specific formats for any of them.
   */
  traits?: {
    /**
     * Title of the Subscriber.
     */
    title?: string
    /**
     * First name of the Subscriber.
     */
    firstname?: string
    /**
     * Last name of the Subscriber.
     */
    lastname?: string
    /**
     * Date of birth of the Subscriber in ISO 8601 format (YYYY-MM-DD).
     */
    dob?: string
    /**
     * Primary address line for the Subscriber.
     */
    address?: string
    /**
     * Secondary address line for the Subscriber.
     */
    address2?: string
    /**
     * Tertiary address line for the Subscriber.
     */
    address3?: string
    /**
     * Phone number of the Subscriber.
     */
    phone?: string
    /**
     * Suburb of the Subscriber.
     */
    suburb?: string
    /**
     * State of the Subscriber.
     */
    state?: string
    /**
     * Country of the Subscriber.
     */
    country?: string
    /**
     * Postcode of the Subscriber.
     */
    postcode?: string
    /**
     * Gender of the Subscriber.
     */
    gender?: string
    [k: string]: unknown
  }
  /**
   * The timestamp of the event in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). Defaults to the current time if not provided.
   */
  timestamp: string
  /**
   * An array of numeric Taguchi List IDs to subscribe the Subscriber to. Leave this field empty if syncing an Audience from Engage.
   */
  subscribeLists?: number[]
  /**
   * An array of numeric Taguchi List IDs to unsubscribe the Subscriber from. Leave this field empty if syncing an Audience from Engage.
   */
  unsubscribeLists?: number[]
}
