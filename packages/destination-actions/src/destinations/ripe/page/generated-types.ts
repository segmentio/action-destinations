// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string | null
  /**
   * The ID associated with the user
   */
  userId?: string | null
  /**
   * The group id
   */
  groupId?: string | null
  /**
   * Page properties
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The name of the page
   */
  name?: string
  /**
   * The page URL
   */
  url?: string | null
  /**
   * The page path
   */
  path?: string | null
  /**
   * URL query string
   */
  search?: string | null
  /**
   * The page referrer
   */
  referrer?: string | null
  /**
   * The page title
   */
  title?: string | null
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The Segment messageId
   */
  messageId?: string
}
