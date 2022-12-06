// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The new user ID, if user ID is not set
   */
  anonymousId: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * The ID associated groupId
   */
  groupId?: string
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
}
