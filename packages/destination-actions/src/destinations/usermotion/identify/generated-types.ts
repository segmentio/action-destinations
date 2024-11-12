// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A identifier for a known user.
   */
  userId: string
  /**
   * An identifier for an anonymous user
   */
  anonymousId?: string
  /**
   * The email address of the identified user
   */
  email: string
  /**
   * Traits to associate with the user
   */
  traits?: {
    [k: string]: unknown
  }
}
