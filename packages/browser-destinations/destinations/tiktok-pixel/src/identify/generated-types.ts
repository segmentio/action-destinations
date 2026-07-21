// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A single phone number in E.164 standard format. TikTok Pixel will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.
   */
  phone_number?: string[]
  /**
   * A single email address. TikTok Pixel will be hash this value before sending to TikTok.
   */
  email?: string[]
  /**
   * The first name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.
   */
  first_name?: string
  /**
   * The last name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.
   */
  last_name?: string
  /**
   * The address of the customer.
   */
  address?: {
    /**
     * The customer's city.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The customer's Zip Code.
     */
    zip_code?: string
    /**
     * The customer's State.
     */
    state?: string
  }
  /**
   * Uniquely identifies the user who triggered the conversion event. TikTok Pixel will hash this value before sending to TikTok.
   */
  external_id?: string[]
}
