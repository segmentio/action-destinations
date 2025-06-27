// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This ID can be any unique string. Event ID is used to deduplicate events sent by both Facebook Pixel and Conversions API.
   */
  eventID?: string
  /**
   * The URL of the page where the event occurred. Can be used to override the default URL taken from the current page.
   */
  eventSourceUrl?: string
  /**
   * The source of the event. This can be used to specify where the event originated from.
   */
  actionSource?: string
  /**
   * User data to be sent with the event. This can include hashed identifiers like email, phone number, etc.
   */
  userData?: {
    /**
     * A unique identifier for the user from your system
     */
    external_id?: string
    /**
     * Email address of the user
     */
    em?: string
    /**
     * Phone number of the user
     */
    ph?: string
    /**
     * First name of the user
     */
    fn?: string
    /**
     * Last name of the user
     */
    ln?: string
    /**
     * Gender of the user. If unknown leave blank.
     */
    ge?: string
    /**
     * Date of birth of the user
     */
    db?: string
    /**
     * City of the user
     */
    ct?: string
    /**
     * State of the user. Two-letter state or province code for the United States, For example, "NY" for New York.
     */
    st?: string
    /**
     * ZIP or postal code of the user. For example, "94025" for Menlo Park, CA, or "10001" for New York City.
     */
    zp?: string
    /**
     * Country code of the user. This should be a valid ISO 3166-1 alpha-2 country code. For example, "US" for the United States.
     */
    country?: string
  }
  /**
   * The currency for the value specified. Currency must be a valid ISO 4217 three-digit currency code.
   */
  currency?: string
  /**
   * A numeric value associated with this event. This could be a monetary value or a value in some other metric.
   */
  value?: number
  /**
   * The custom data object can be used to pass custom properties.
   */
  custom_data?: {
    [k: string]: unknown
  }
}
