// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * This is an external user identifier defined by data providers.
   */
  externalUserId: string
  /**
   * User email address.
   */
  email?: string
  /**
   * User first name.
   */
  firstName?: string
  /**
   * User Last name.
   */
  lastName?: string
  /**
   * Phone Number.
   */
  phone?: string
  /**
   * Postal Code.
   */
  postal?: string
  /**
   * State Code.
   */
  state?: string
  /**
   * City name.
   */
  city?: string
  /**
   * Address Code.
   */
  address?: string
  /**
   * A number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.
   */
  audienceId: string
  /**
   * Describes consent given by the user for advertising purposes. For EU advertisers, it is required to provide one of Geo ipAddress, amazonConsent, tcf, or gpp.
   */
  consent?: {
    /**
     * Captures the user's geographic information (IP address) for consent checking.
     */
    ipAddress?: string
    /**
     * Amazon Consent Format: Captures whether the user has consented to cookie based tracking.
     */
    amznAdStorage?: string
    /**
     * Amazon Consent Format: Captures whether the user has consented to use personal data for advertising.
     */
    amznUserData?: string
    /**
     * An encoded Transparency and Consent Framework (TCF) string describing user consent choices.
     */
    tcf?: string
    /**
     * An encoded Global Privacy Platform (GPP) string describing user privacy preferences.
     */
    gpp?: string
  }
  /**
   * When enabled,segment will send data in batching
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower. Minimum value is 1500 and maximum is 10000.
   */
  batch_size?: number
}
