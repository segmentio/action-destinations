// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The anonymous id
   */
  anonymousId: string
  /**
   * The ID associated with the user
   */
  userId?: string | null
  /**
   * The ID associated groupId
   */
  groupId?: string | null
  /**
   * The category of the page
   */
  category?: string
  /**
   * The name of the page
   */
  name?: string
  /**
   * Page properties
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The Segment messageId
   */
  messageId?: string
}
