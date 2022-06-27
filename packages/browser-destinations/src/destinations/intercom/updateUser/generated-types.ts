// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's identity
   */
  user_id?: string
  /**
   * The Segment traits to be forwarded to Intercom
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * User's name
   */
  name?: string
  /**
   * Phone number of the current user/lead
   */
  phone?: string
  /**
   * Sets the [unsubscribe status] of the record
   */
  unsubscribed_from_emails?: boolean
  /**
   * The messenger language (instead of relying on browser language settings)
   */
  language_override?: string
  /**
   * User's email
   */
  email?: string
  /**
   * A timestamp of when the person was created
   */
  created_at?: string | number
  /**
   * The avatar/profile image associated to the current record (typically gathered via social profiles via email address)
   */
  avatar?: {
    [k: string]: unknown
  }
  /**
   * Used for identity verification
   */
  user_hash?: string
  /**
   * The user's company
   */
  company?: {
    [k: string]: unknown
  }
  /**
   * An array of companies the user is associated to
   */
  companies?: {
    [k: string]: unknown
  }[]
}
