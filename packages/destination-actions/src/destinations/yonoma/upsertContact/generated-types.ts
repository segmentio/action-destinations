// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifiers for the contact. At least one of userId or anonymousId is required.
   */
  identifiers: {
    /**
     * Unique user identifier from your app.
     */
    userId?: string
    /**
     * Anonymous identifier from Segment for tracking pre-identified activity.
     */
    anonymousId?: string
    /**
     * Contact's email address. Required if userId is not provided.
     */
    email?: string
  }
  /**
   * The Yonoma list to add the contact to.
   */
  listId: string
  /**
   * Additional Contact metadata.
   */
  properties?: {
    /**
     * Contact's first name.
     */
    firstName?: string
    /**
     * Contact's last name.
     */
    lastName?: string
    /**
     * Contact's phone number.
     */
    phone?: string
    /**
     * Contact's date of birth in YYYY-MM-DD format.
     */
    dateOfBirth?: string
    /**
     * Contact's address.
     */
    address?: string
    /**
     * Contact's city.
     */
    city?: string
    /**
     * Contact's state or province.
     */
    state?: string
    /**
     * Contact's country.
     */
    country?: string
    /**
     * Contact's postal code.
     */
    zipcode?: string
  }
  /**
   * Indicates if the Contact is subscribed or unsubscribed from marketing emails. Set to true to subscribe, false to unsubscribe.
   */
  status?: boolean
  /**
   * List of tags to add to the Contact. Can be a single string or array of tags. Tags must already exist in Yonoma.
   */
  tags_to_add?: string[]
  /**
   * List of tags to remove from the Contact. Can be a single string or array of strings. Tags must already exist in Yonoma.
   */
  tags_to_remove?: string[]
}
