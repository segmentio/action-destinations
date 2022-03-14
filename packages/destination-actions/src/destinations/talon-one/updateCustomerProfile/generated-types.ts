// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * List the AVPs you need to update in the customer profile.
   */
  attributes?: boolean & string[]
  /**
   * Unique identifier of the customer profile.
   */
  customerProfileId: string
  /**
   * Add or Delete Audience ID.
   */
  audienceId?: boolean & number[]
  /**
   * Set to true if the update requires to trigger all the rules.
   */
  runRuleEngine?: boolean
}
