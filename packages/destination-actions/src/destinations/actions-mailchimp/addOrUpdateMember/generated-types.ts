// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the audience member. Used to identify the member (hashed for the API endpoint).
   */
  email_address: string
  /**
   * The Mailchimp Audience (List) ID to add the member to. Defaults to the Audience ID configured in settings.
   */
  list_id?: string
  /**
   * The subscription status to apply only when creating a new member. Protects the consent status of existing members.
   */
  status_if_new: string
  /**
   * The subscription status to apply to the member. Applies to existing members too — use with care to respect consent.
   */
  status?: string
  /**
   * Mailchimp merge fields (e.g. FNAME, LNAME, and custom fields), keyed by the Mailchimp merge tag.
   */
  merge_fields?: {
    [k: string]: unknown
  }
  /**
   * The member's language (e.g. en).
   */
  language?: string
  /**
   * Whether the member is a VIP.
   */
  vip?: boolean
  /**
   * Tags to apply to the member on creation or update.
   */
  tags?: string[]
  /**
   * When enabled, sends events to Mailchimp in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
