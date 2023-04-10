// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId?: string
  /**
   * The user's email
   */
  email?: string
  /**
   * The user's creation date
   */
  createdAt?: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The Segment traits to be forwarded to Usermaven
   */
  traits?: {
    firstName?: string
    lastName?: string
    company?: {
      [k: string]: unknown
    }
    custom?: {
      [k: string]: unknown
    }
    [k: string]: unknown
  }
}
