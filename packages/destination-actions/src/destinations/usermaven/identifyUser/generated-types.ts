// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The user's email
   */
  userEmail: string
  /**
   * The user's created at
   */
  userCreatedAt: string
  /**
   * The user's first name
   */
  userFirstName?: string
  /**
   * The user's last name
   */
  userLastName?: string
  /**
   * The custom attributes to be forwarded to UserMaven
   */
  userCustomAttributes?: {
    [k: string]: unknown
  }
}
