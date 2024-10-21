// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
   * The subject of the email.
   */
  subject: string
  /**
   * Headers for the email.
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * A collection property names that will be substituted by their corresponding property values in the subject, reply-to and content portions of a SendGrid Dynamic Template.
   */
  dynamic_template_data?: {
    /**
     * The key of the dynamic template data.
     */
    key: string
    /**
     * The value of the dynamic template data.
     */
    value: string
    /**
     * If true, the email will not be sent if the Value field is empty, unless there is a default specified.
     */
    required: boolean
    /**
     * The default value to use if the value field is empty.
     */
    default?: string
    [k: string]: unknown
  }[]
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
   * Click tracking settings for the email.
   */
  click_tracking?: {
    /**
     * Indicates if this setting is enabled
     */
    enable: boolean
    /**
     * Indicates if this setting should be included in the text/plain portion of your email.
     */
    enable_text?: boolean
  }
  /**
   * Allows you to track if the email was opened by including a single transparent pixel image in the body of the message content.
   */
  open_tracking?: {
    /**
     * Indicates if this setting is enabled
     */
    enable: boolean
    /**
     * Allows you to specify a substitution tag that you can insert in the body of your email at a location that you desire. This tag will be replaced by the open tracking pixel.
     */
    substitution_tag?: string
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
  categories?: {
    /**
     * Category name.
     */
    category: string
  }[]
  /**
   * Allows you to enable tracking provided by Google Analytics.
   */
  googleAnalytics?: {
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
  ipPoolName?: string
  /**
   * Subscription settings for the email.
   */
  ASM?: {
    /**
     * Specify a Subscription Group ID to ensure emails are sent to only users who are subscribed to that group.
     */
    groupId?: number
  }
  /**
   * A collection of different mail settings that you can use to specify how you would like this email to be handled.
   */
  mail_settings?: {
    /**
     * Allows you to bypass all unsubscribe groups and suppressions to ensure that the email is delivered to every single recipient.
     */
    bypass_list_management?: boolean
    /**
     * Allows you to bypass the global unsubscribe list to ensure that the email is delivered to recipients. This filter applies only to global unsubscribes and will not bypass group unsubscribes. This filter cannot be combined with the bypass_list_management.
     */
    bypass_unsubscribe_management?: boolean
    /**
     * Sandbox Mode allows you to send a test email to ensure that your request body is valid and formatted correctly.
     */
    sandbox_mode?: boolean
  }
}
