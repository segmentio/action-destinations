// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
   * Information about the user.
   */
  user: {
    id: string
    email: string
    anonymous_id?: string
    first_name?: string
    last_name?: string
    created_at: string
    custom?: {
      [k: string]: unknown
    }
  }
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
    source?: string
    medium?: string
    name?: string
    term?: string
    content?: string
  }
  /**
   * Information about the screen.
   */
  screen?: {
    height?: number
    width?: number
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
