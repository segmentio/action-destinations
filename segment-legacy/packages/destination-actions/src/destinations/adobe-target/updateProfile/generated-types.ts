// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A user's unique visitor ID. This field is used to fetch a matching profile in Adobe Target to make an update on. For more information, please see our Adobe Target Destination documentation.
   */
  user_id: string
  /**
   * Profile parameters specific to a user. Please note, Adobe recommends that PII is hashed prior to sending to Adobe.
   */
  traits: {
    [k: string]: unknown
  }
}
