// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The External ID of the account to send properties for
   */
  account_id: string
  /**
   * The Account name
   */
  name: string
  /**
   * The timestamp when the account was created, represented in the ISO-8601 date format. For instance, "2023-09-26T15:30:00Z".
   */
  created_at?: string
  /**
   * The properties of the account
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Subscription plan the account is associated with
   */
  plan?: string
  /**
   * The account industry
   */
  industry?: string
  /**
   * The account website
   */
  website?: string
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
