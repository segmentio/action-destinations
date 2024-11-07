// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom fields to add to a person's profile.
   */
  customFields?: {
    [k: string]: unknown
  }
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
   * The person's status.
   */
  status?: string
  /**
   * The timestamp associated with the update to a person's status.
   */
  statusUpdatedAt?: string | number
  /**
   * Tags to add to a person's profile.
   */
  tags?: string
  /**
   * The person's timezone.
   */
  timezone?: string
}
