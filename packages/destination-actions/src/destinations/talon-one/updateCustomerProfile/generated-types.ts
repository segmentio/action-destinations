// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Extra attributes associated with the customer profile. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * The customer profile integration identifier to use in Talon.One.
   */
  customerProfileId: string
  /**
   * You should get this audience ID from Talon.One.
   */
  deleteAudienceIds?: number[]
  /**
   * You should get this audience ID from Talon.One.
   */
  addAudienceIds?: number[]
  /**
   * This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.
   */
  runRuleEngine?: boolean
}
