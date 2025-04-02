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
   * POstal Code.
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
   * When enabled,segment will send data in batching
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
