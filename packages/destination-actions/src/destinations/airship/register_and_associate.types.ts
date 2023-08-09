// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User
   */
  named_user_id?: string
  /**
   * Locale includes country and language
   */
  locale: string
  /**
   * Timezone
   */
  timezone: string
  /**
   * Classic or Double
   */
  opt_in_choices?: string
  /**
   * Information about the email registration.
   */
  channel_object: {
    /**
     * Email address to register (required)
     */
    address: string
    /**
     * The date-time when a user gave explicit permission to receive commercial emails
     */
    commercial_opted_in?: string
    /**
     * The date-time when a user explicitly denied permission to receive commercial emails.
     */
    commercial_opted_out?: string
    /**
     * The date-time when a user opted in to click tracking.
     */
    click_tracking_opted_in?: string
    /**
     * The date-time when a user opted out of click tracking.
     */
    click_tracking_opted_out?: string
    /**
     * The date-time when a user opted in to open tracking.
     */
    open_tracking_opted_in?: string
    /**
     * The date-time when a user opted out of open tracking.
     */
    open_tracking_opted_out?: string
    /**
     * The date-time when a user gave explicit permission to receive transactional emails. Users do not need to opt-in to receive transactional emails unless they have previously opted out.
     */
    transactional_opted_in?: string
    /**
     * The date-time when a user explicitly denied permission to receive transactional emails.
     */
    transactional_opted_out?: string
    /**
     * If an email channel is suppressed, the reason for its suppression. Email channels with any suppression state set will not have any delivery to them fulfilled. If a more specific reason is not known, use imported. Possible values: spam_complaint, bounce, imported
     */
    suppression_state?: string
    [k: string]: unknown
  }
}
