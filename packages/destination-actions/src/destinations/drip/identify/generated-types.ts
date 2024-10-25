// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The person's email address.
   */
  email: string
  /**
   * The person's ip address.
   */
  ip?: string
  /**
   * The person's timezone.
   */
  timezone?: string
  /**
   * Tags to add to a person's profile.
   */
  tags?: {
    [k: string]: unknown
  }
  /**
   * Custom fields to add to a person's profile.
   */
  customFields?: {
    [k: string]: unknown
  }
}
