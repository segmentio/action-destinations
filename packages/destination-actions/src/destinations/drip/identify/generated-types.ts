// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom fields to add to a person's profile.
   */
  custom_fields?: {
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
  phone?: string
  /**
   * The person's subscription status.
   */
  status?: string
  /**
   * The timestamp associated with the update to a person's status.
   */
  status_updated_at?: string | number
  /**
   * Tags to add to a person's profile. Should be a comma separated list. e.g. "tag1,tag2".
   */
  tags?: string
  /**
   * The person's timezone.
   */
  timezone?: string
}
