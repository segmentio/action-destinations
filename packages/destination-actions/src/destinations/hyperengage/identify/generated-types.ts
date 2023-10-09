// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The External ID of the user
   */
  user_id: string
  /**
   * The user's name
   */
  name?: string | null
  /**
   * The user's first name. This field is mandatory if you're not providing a name field
   */
  first_name?: string | null
  /**
   * The user's last name. This field is mandatory if you're not providing a name field
   */
  last_name?: string | null
  /**
   * The user's email address
   */
  email?: string
  /**
   * The account id, to uniquely identify the account associated with the user
   */
  account_id?: string
  /**
   * The timestamp when the user was created, represented in the ISO-8601 date format. For instance, "2023-09-26T15:30:00Z".
   */
  created_at?: string
  /**
   * Properties to associate with the user
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * User Anonymous id
   */
  anonymous_id?: string | null
  /**
   * The ID of the event.
   */
  event_id?: string
  /**
   * The path of the document.
   */
  doc_path?: string
  /**
   * The search query of the document.
   */
  doc_search?: string
  /**
   * The title of the page where the event occurred.
   */
  doc_title?: string
  /**
   * The URL of the page where the event occurred.
   */
  url?: string
  /**
   * The referrer of the page where the event occurred.
   */
  referer?: string
  /**
   * The user agent of the browser.
   */
  user_agent?: string
  /**
   * The language of the browser.
   */
  user_language?: string
  /**
   * The time of the event in UTC.
   */
  utc_time?: string
  /**
   * Information about the UTM parameters.
   */
  utm?: {
    /**
     * The source of the campaign.
     */
    source?: string
    /**
     * The medium of the campaign.
     */
    medium?: string
    /**
     * The name of the campaign.
     */
    name?: string
    /**
     * The term of the campaign.
     */
    term?: string
    /**
     * The content of the campaign.
     */
    content?: string
  }
  /**
   * Information about the screen.
   */
  screen?: {
    /**
     * The height of the screen.
     */
    height?: number
    /**
     * The width of the screen.
     */
    width?: number
    /**
     * The density of the screen.
     */
    density?: number
  }
  /**
   * The timezone of the browser.
   */
  timezone?: string
  /**
   * The IP address of the user.
   */
  source_ip?: string
}
