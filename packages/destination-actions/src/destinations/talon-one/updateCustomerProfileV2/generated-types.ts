// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The customer profile integration identifier to use in Talon.One.
   */
  customerProfileId: string
  /**
   * Audience name and integrationId
   */
  audiencesToAdd?: {
    /**
     * The name of the audience.
     */
    name: string
    /**
     * The integrationId of the audience.
     */
    integrationId?: string
  }[]
  /**
   * Audience name and integrationId
   */
  audiencesToDelete?: {
    /**
     * The name of the audience.
     */
    name: string
    /**
     * The integrationId of the audience.
     */
    integrationId?: string
  }[]
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
  /**
   * Use this field if you want to identify an attribute with a specific type
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
