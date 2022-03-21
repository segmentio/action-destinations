// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Arbitrary additional JSON data associated with the customer profile.
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * Unique identifier of the customer profile.
   */
  customerProfileId: string
  /**
   * You should get this audience ID from Talon.One.
   */
  deleteAudienceIDs?: number[]
  /**
   * You should get this audience ID from Talon.One.
   */
  addAudienceIDs?: number[]
  /**
   * This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.
   */
  runRuleEngine?: boolean
}
