// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * You should have this object as it is necessary to store at least one data item.
   */
  data: {
    [k: string]: unknown
  }[]
  /**
   * Unique identifier of the customer profile.
   */
  CustomerProfileId: string
  /**
   * List the AVPs you need to update in the customer profile.
   */
  attributes?: boolean & string[]
  /**
   * List the AVPs you need to update in the customer profile.
   */
  mutualAttributes?: boolean & string[]
}
