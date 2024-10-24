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
   * The template ID to use for the email. This must be for a Dynamic Template and should start with a 'd-'
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
   * Reply to details.
   */
  reply_to: {
    /**
     * Whether "reply to" settings are the same as "from"
     */
    reply_to_equals_from: boolean
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
   * Allows you to insert a subscription management link at the bottom of the text and HTML bodies of your email.
   */
  subscription_tracking?: {
    /**
     * Indicates if this setting is enabled
     */
    enable: boolean
    /**
     * Text to be appended to the email with the subscription tracking link.
     */
    text?: string
    /**
     * HTML to be appended to the email with the subscription tracking link.
     */
    html?: string
    /**
     * A tag that will be replaced with the unsubscribe URL. If this property is used, it will override both the text and html properties.
     */
    substitution_tag?: string
  }
  /**
   * Categories for the email.
   */
  categories?: string[]
  /**
   * Allows you to enable tracking provided by Google Analytics.
   */
  google_analytics?: {
    /**
     * Indicates if this setting is enabled
     */
    enable: boolean
    /**
     * Name of the referrer source. (e.g., Google, SomeDomain.com, or Marketing Email)
     */
    utm_source?: string
    /**
     * Name of the marketing medium. (e.g., Email)
     */
    utm_medium?: string
    /**
     * Used to identify any paid keywords.
     */
    utm_term?: string
    /**
     * Used to differentiate your campaign from advertisements.
     */
    utm_content?: string
    /**
     * The name of the campaign.
     */
    utm_campaign?: string
  }
  /**
   * Send email with an ip pool.
   */
  ip_pool_name?: string
  /**
   * Specify a Group ID
   */
  group_id?: string
  /**
   * Sandbox Mode allows you to send a test email to ensure that your request body is valid and formatted correctly.
   */
  sandbox_mode?: boolean
}
