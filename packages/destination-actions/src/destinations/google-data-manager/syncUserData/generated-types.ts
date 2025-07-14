// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the audience member.
   */
  emailAddress?: string
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
   * The country code of the user.
   */
  regionCode?: string
  /**
   * The postal code of the audience member.
   */
  postalCode?: string
  /**
   * The ID of the Audience.
   */
  audienceId?: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
}
