// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId?: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The user's name
   */
  name?: string
  /**
   * The user's email
   */
  email?: string
  /**
   * The Segment traits to be forwarded to FullSession
   */
  traits?: {
    [k: string]: unknown
  }
}
