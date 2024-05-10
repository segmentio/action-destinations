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
   * User email address. Vaule will be hashed before sending to Amazon.
   */
  email?: string
  /**
   * User first name. Vaue will be hashed before sending to Amazon.
   */
  firstName?: string
  /**
   * User Last name. Vaue will be hashed before sending to Amazon.
   */
  lastName?: string
  /**
   * Phone Number. Vaue will be hashed before sending to Amazon.
   */
  phone?: string
  /**
   * POstal Code. Vaue will be hashed before sending to Amazon.
   */
  postal?: string
  /**
   * State Code. Vaue will be hashed before sending to Amazon.
   */
  state?: string
  /**
   * City name. Vaue will be hashed before sending to Amazon.
   */
  city?: string
  /**
   * Address Code. Value will be hashed before sending to Amazon.
   */
  address?: string
  /**
   * An number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.
   */
  audienceId: string
  /**
   * When enabled,segment will send data in batching
   */
  enable_batching: boolean
}
