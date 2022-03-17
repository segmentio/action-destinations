// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier of the customer profile.
   */
  customerProfileId: string
  /**
   * List the AVPs you need to update in the customer profile.
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * List the AVPs you need to update in the customer profile.
   */
  mutualAttributes?: {
    [k: string]: unknown
  }
}
