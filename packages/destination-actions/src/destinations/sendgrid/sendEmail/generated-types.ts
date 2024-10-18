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
    name: string
  }
  /**
   * Reply to details.
   */
  replyTo: {
    /**
     * Whether "reply to" settings are the same as "from"
     */
    replyToEqualsFrom: boolean
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
   * To email addresses
   */
  to: {
    /**
     * The email address of the recipient.
     */
    email: string
  }[]
  /**
   * CC email addresses
   */
  cc?: {
    /**
     * The email address of the CC recipient.
     */
    email: string
  }[]
  /**
   * BCC email addresses
   */
  bcc?: {
    /**
     * The email address of the BCC recipient.
     */
    email: string
  }[]
  /**
   * The subject of the email.
   */
  subject: string
  /**
   * The template ID to use for the email.
   */
  templateId: string
  /**
   * Preview Text
   */
  previewText?: string
  /**
   * The dynamic template data to use for the email.
   */
  dynamicTemplateData?: {
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
   * The time to send the email. ISO 8601 format. E.g. 2024-09-23T12:00:00Z
   */
  sendAt?: string
  /**
   * Tracking settings for the email.
   */
  trackingSettings?: {
    /**
     * Enable open tracking
     */
    openTracking?: boolean
    /**
     * Enable click tracking
     */
    clickTracking?: boolean
  }
  /**
   * Custom arguments for the email.
   */
  customArgs?: {
    [k: string]: unknown
  }[]
  /**
   * Categories for the email.
   */
  categories?: {
    /**
     * Category name.
     */
    category?: string
  }[]
  /**
   * Enable sandbox mode. If true, the email will not actually be sent, but will be validated.
   */
  sandboxMode: boolean
  /**
   * Send email with an ip pool.
   */
  ipPool?: string
  /**
   * Subscription settings for the email.
   */
  subscriptionSettings?: {
    /**
     * Specify a Subscription Group ID to ensure emails are sent to only users who are subscribed to that group.
     */
    groupId?: string
    /**
     * Send email without subscription check.
     */
    byPassSubscription?: boolean
  }
  /**
   * Send email without subscription check.
   */
  bypassListManagement?: boolean
}
