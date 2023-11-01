// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  uid?: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The user's display name
   */
  displayName?: string
  /**
   * The user's email
   */
  email?: string
  /**
   * The Segment traits to be forwarded to FullStory
   */
  properties?: {
    [k: string]: unknown
  }
}
