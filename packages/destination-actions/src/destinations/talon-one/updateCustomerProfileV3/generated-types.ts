// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The customer profile integration identifier to use in Talon.One.
   */
  customerProfileId: string
  /**
   * Indicates whether to skip non-existing attributes. If `Yes`, the non-existing attributes are skipped and a 400 error is not returned. If `No`, a 400 error is returned in case of non-existing attributes.
   */
  skipNonExistingAttributes?: boolean
  /**
   * You should get these audience IDs from Talon.One.
   */
  deleteAudienceIds?: number[]
  /**
   * You should get these audience IDs from Talon.One.
   */
  addAudienceIds?: number[]
  /**
   * This runs rule engine in Talon.One upon updating customer profile. Set to true to trigger rules.
   */
  runRuleEngine?: boolean
  /**
   * Extra attributes associated with the customer profile. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
   */
  attributes?: {
    [k: string]: unknown
  }
}
