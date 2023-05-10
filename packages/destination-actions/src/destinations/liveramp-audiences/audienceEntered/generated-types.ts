// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifies the user within the target audience.
   */
  audience_key: string
  /**
   * Additional information pertaining to the user.
   */
  identifier_data?: {
    [k: string]: unknown
  }
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * Name of the audience the user has entered.
   */
  audience_name: string
  /**
   * Datetime at which the event was received. Used to disambiguate the resulting file.
   */
  received_at: string | number
}
