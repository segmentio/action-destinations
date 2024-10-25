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
   * The person's sms number.
   */
  sms?: string
  /**
   * The person's timezone.
   */
  timezone?: string
  /**
   * The person's status.
   */
  status?: string
  /**
   * The timestamp associated with the update to a person's status.
   */
  status_updated_at?: string | number
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
