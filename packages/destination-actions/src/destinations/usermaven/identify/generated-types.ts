// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user id, to uniquely identify the user
   */
  user_id: string
  /**
   * The user email address
   */
  user_email: string
  /**
   * The timestamp when the user was created
   */
  user_created_at?: string
  /**
   * The user first name
   */
  user_first_name?: string
  /**
   * The user last name
   */
  user_last_name?: string
  /**
   * The user custom attributes
   */
  user_custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * User Anonymous id
   */
  user_anonymous_Id?: string | null
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
   * The type of the event.
   */
  event_type?: string
  /**
   * The title of the page where the event occurred.
   */
  page_title?: string
  /**
   * The referrer of the page where the event occurred.
   */
  referer?: string
  /**
   * The URL of the page where the event occurred.
   */
  url?: string
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
  ip?: string
}
