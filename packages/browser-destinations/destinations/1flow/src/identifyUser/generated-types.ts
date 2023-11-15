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
   * The user's first_name
   */
  first_name?: string
  /**
   * The user's last_name
   */
  last_name?: string
  /**
   * The user's phone
   */
  phone?: string
  /**
   * The user's email
   */
  email?: string
  /**
   * The Segment traits to be forwarded to 1Flow
   */
  traits?: {
    [k: string]: unknown
  }
}
