// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom fields to add to a person's profile. Non string values will be stringified.
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
   * The person's subscription status if newly identified.
   */
  initial_status?: string
  /**
   * The person's subscription status. Overrides initial_status.
   */
  status?: string
  /**
   * The timestamp associated with the update to a person's status.
   */
  status_updated_at?: string | number
  /**
   * Comma delimited list of tags to add to a person's profile. e.g. "tag1,tag2".
   */
  tags?: string
  /**
   * The person's timezone.
   */
  timezone?: string
}
