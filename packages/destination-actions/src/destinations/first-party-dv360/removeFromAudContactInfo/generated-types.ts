// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A list of the user's emails. If not already hashed, the system will hash them before use.
   */
  emails?: string
  /**
   * A list of the user's phone numbers. If not already hashed, the system will hash them before use.
   */
  phoneNumbers?: string
  /**
   * A list of the user's zip codes.
   */
  zipCodes?: string
  /**
   * The user's first name. If not already hashed, the system will hash it before use.
   */
  firstName?: string
  /**
   * The user's last name. If not already hashed, the system will hash it before use.
   */
  lastName?: string
  /**
   * The country code of the user.
   */
  countryCode?: string
  /**
   * The ID of the DV360 Audience.
   */
  external_id?: string
  /**
   * The Advertiser ID associated with the DV360 Audience.
   */
  advertiser_id?: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
}
