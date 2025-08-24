// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the audience member.
   */
  emailAddress: string
  /**
   * The phone number of the audience member.
   */
  phoneNumber?: string
  /**
   * The given name (first name) of the audience member.
   */
  givenName?: string
  /**
   * The family name (last name) of the audience member.
   */
  familyName?: string
  /**
   * The region code (e.g., country code) of the audience member.
   */
  regionCode?: string
  /**
   * The postal code of the audience member.
   */
  postalCode?: string
  /**
   * A number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.
   */
  audienceId: string
  /**
   * When enabled,segment will send data in batching
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
