// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The domain to use for the email. This field is optional but recommended. If you do not provide a domain, Sendgrid will attempt to send the email based on the from address, and may fail if the domain in the from address is not validated.
   */
  domain?: string
  /**
   * From details.
   */
  from: {
    /**
     * The email address of the sender.
     */
    email: string
    /**
     * From name of the sender, displayed to the recipient.
     */
    name?: string
  }
  /**
   * Recipient details.
   */
  to: {
    /**
     * The email address of the recipient.
     */
    email: string
    /**
     * The name of the recipient.
     */
    name?: string
  }[]
  /**
   * CC recipient details
   */
  cc?: {
    /**
     * The email address of the CC recipient.
     */
    email: string
    /**
     * The name of the CC recipient.
     */
    name?: string
  }[]
  /**
   * BCC recipient details
   */
  bcc?: {
    /**
     * The email address of the BCC recipient.
     */
    email: string
    /**
     * The name of the BCC recipient.
     */
    name?: string
  }[]
  /**
   * Headers for the email.
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * A collection of property names that will be substituted by their corresponding property values in the subject, reply-to and content portions of a SendGrid Dynamic Template.
   */
  dynamic_template_data?: {
    [k: string]: unknown
  }
  /**
   * The Dynamic Template to use for the email.
   */
  template_id: string
  /**
   * Custom arguments for the email.
   */
  custom_args?: {
    [k: string]: unknown
  }
  /**
   * The time to send the email. ISO 8601 format. E.g. 2024-09-23T12:00:00Z. A send cannot be scheduled more than 72 hours in advance.
   */
  send_at?: string
  /**
   * Reply to details. If left empty 'Reply To' settings will be taken from the 'From' field values.
   */
  reply_to?: {
    /**
     * The email to reply to.
     */
    email?: string
    /**
     * The name to reply to.
     */
    name?: string
  }
  /**
   * Categories for the email. Accepts a single string or array of strings.
   */
  categories?: string[]
  /**
   * Send email with an ip pool.
   */
  ip_pool_name?: string
  /**
   * Specify a Group ID
   */
  group_id?: string
}
