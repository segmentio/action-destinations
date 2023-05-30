// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User
   */
  named_user_id: string
  /**
   * When the Trait was set
   */
  occurred: string | number
  /**
   * User Attributes. Attributes should exist in Airship in order to be set, including the predifined ones defaulted here.
   */
  attributes?: {
    /**
     * Title (Mr, Mrs, Professor, ...
     */
    title?: string
    /**
     * The user's first name.
     */
    first_name?: string
    /**
     * The user's last name.
     */
    last_name?: string
    /**
     * The user's full name.
     */
    full_name?: string
    /**
     * The user's gender.
     */
    gender?: string
    /**
     * The user's zipcode.
     */
    zipcode?: number
    /**
     * The user's city.
     */
    city?: string
    /**
     * The user's region.
     */
    region?: string
    /**
     * The user's country.
     */
    country?: string
    /**
     * The user's birthdate.
     */
    birthdate?: string | number
    /**
     * The user's age in years.
     */
    age?: number
    /**
     * The user's mobile phone number.
     */
    mobile_phone?: number
    /**
     * The user's home phone number.
     */
    home_phone?: number
    /**
     * The user's work phone number.
     */
    work_phone?: number
    /**
     * The user's loyalty tier.
     */
    loyalty_tier?: string
    /**
     * The user's company name.
     */
    company?: string
    /**
     * The user's username.
     */
    username?: string
    /**
     * The user's account creation date.
     */
    account_creation?: string | number
    /**
     * The user's email address.
     */
    email?: string
    /**
     * The user's altitude.
     */
    altitude?: number
    /**
     * The user's latitude.
     */
    latitude?: number
    /**
     * The user's longitude.
     */
    longitude?: number
    /**
     * The user's advertising ID.
     */
    advertising_id?: string
    [k: string]: unknown
  }
}
