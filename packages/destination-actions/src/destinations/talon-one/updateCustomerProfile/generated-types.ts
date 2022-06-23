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
   * Use this field you want to specify an attribute type
   */
  attributesInfo?: {
    /**
     * Attribute name
     */
    name: string
    /**
     * Attribute type. Can be only `string`, `time`, `number`, `boolean`, `location`
     */
    type: string
  }[]
}
