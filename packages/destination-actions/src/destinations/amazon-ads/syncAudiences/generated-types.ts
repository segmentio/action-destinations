// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This is an external user identifier defined by data providers.
   */
  externalUserId: string
  /**
   * Traits or properties object from the payload
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Audience name AKA Audience Key
   */
  computation_key: string
  /**
   * User email address. Vaule will be hashed before sending to Amazon.
   */
  email?: string
  /**
   * User first name. Vaue will be hashed before sending to Amazon.
   */
  firstname?: string
  /**
   * User Last name. Vaue will be hashed before sending to Amazon.
   */
  lastname?: string
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
}
