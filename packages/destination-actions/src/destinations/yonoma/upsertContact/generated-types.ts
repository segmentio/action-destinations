// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifiers for the contact. User ID and email are required. Anonymous ID is optional.
   */
  identifiers: {
    /**
     * Unique user identifier from your app.
     */
    userId: string
    /**
     * Anonymous identifier from Segment for tracking pre-identified activity.
     */
    anonymousId?: string
    /**
     * Contact's email address.
     */
    email: string
  }
  /**
   * The Yonoma list to add the contact to.
   */
  listId: string
  /**
   * Indicates if the Contact is subscribed or unsubscribed from marketing emails. Set to true to subscribe, false to unsubscribe.
   */
  status: boolean
  /**
   * The timestamp of the event. Defaults to the current time if not provided.
   */
  timestamp?: string
  /**
   * The IP address of the user. Defaults to the current user IP if not provided.
   */
  ip?: string
  /**
   * The user agent of the user.
   */
  userAgent?: string
  /**
   * The details of the page being viewed.
   */
  page?: {
    /**
     * Full URL of the page visited.
     */
    url?: string
    /**
     * Title of the page.
     */
    title?: string
    /**
     * URL of the referring page.
     */
    referrer?: string
    /**
     * Path of the page being viewed.
     */
    path?: string
    /**
     * Search query used to find the page.
     */
    search?: string
  }
  /**
   * The marketing campaign that referred the user to the site.
   */
  campaign?: {
    /**
     * Name of the campaign.
     */
    name?: string
    /**
     * Source of the campaign UTM parameter.
     */
    source?: string
    /**
     * Medium of the campaign UTM parameter.
     */
    medium?: string
    /**
     * Term or keyword of the campaign UTM parameter.
     */
    term?: string
    /**
     * Content of the campaign UTM parameter.
     */
    content?: string
  }
  /**
   * The geographic location of the user.
   */
  location?: {
    /**
     * Country of the user.
     */
    country?: string
    /**
     * Region or state of the user.
     */
    region?: string
    /**
     * City of the user.
     */
    city?: string
  }
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
     * Contact's date of birth in YYYY-MM-DD or ISO8601 format.
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
   * List of tags to add to the Contact. Can be a single string or array of tags. Tags must already exist in Yonoma.
   */
  tags_to_add?: string[]
  /**
   * List of tags to remove from the Contact. Can be a single string or array of strings. Tags must already exist in Yonoma.
   */
  tags_to_remove?: string[]
}
