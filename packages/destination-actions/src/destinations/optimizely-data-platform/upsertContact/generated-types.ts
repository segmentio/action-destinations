// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User identifier details to send to Optimizely.
   */
  user_identifiers: {
    /**
     * Segment Anonymous ID
     */
    anonymousId?: string
    /**
     * Segment User ID
     */
    userId?: string
    /**
     * User Email address
     */
    email?: string
    /**
     * Optimizely VUID - user cookie generated created by Optimizely Javascript library
     */
    optimizely_vuid?: string
  }
  /**
   * The name of the company associated with the Contact
   */
  company?: string
  /**
   * The Contact's Title
   */
  title?: string
  /**
   * Contact's full name
   */
  name?: string
  /**
   * Contact's first name
   */
  firstname?: string
  /**
   * Contact's last name
   */
  lastname?: string
  /**
   * Contact's gender
   */
  gender?: string
  /**
   * Contact's birthday. The format should be datetime
   */
  DOB?: string | number
  /**
   * Contact's phone number.
   */
  phone?: string
  /**
   * Address details object
   */
  address?: {
    /**
     * The user's steet.
     */
    street?: string
    /**
     * The user's city.
     */
    city?: string
    /**
     * The user's state or region.
     */
    state?: string
    /**
     * Zip or postal code
     */
    zip?: string
    /**
     * The user's country.
     */
    country?: string
  }
  /**
   * The user's avatar image URL.
   */
  imageURL?: string
}
