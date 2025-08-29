// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's unique identifier.
   */
  userId?: string
  /**
   * The user's anonymous identifier when no user ID is available.
   */
  anonymousId?: string
  /**
   * User traits and properties to be sent to FullSession.
   */
  traits?: {
    [k: string]: unknown
  }
}
