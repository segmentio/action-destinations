// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * At least one identifier is required. Any identifiers sent will then become required for fugure updates to that Subscriber.
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
    /**
     * Phone number of the Subscriber.
     */
    phone?: string
    /**
     * The internal Taguchi ID of the Subscriber. usually not visible ourside the Taguchi platform.
     */
    id?: number
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
   * Array or comma delimited list of Taguchi List IDs to subscribe the Subscriber to.
   */
  subscribeLists?: string[]
  /**
   * Array or comma delimited list of Taguchi List IDs to unsubscribe the Subscriber from.
   */
  unsubscribeLists?: string[]

  timestamp: string
}
