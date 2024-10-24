// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A identifier for a known user.
   */
  userId?: string
  /**
   * An identifier for an anonymous user
   */
  anonymousId?: string
  /**
   * A identifier for a known company.
   */
  groupId: string
  /**
   * Traits to associate with the company
   */
  traits?: {
    [k: string]: unknown
  }
}
