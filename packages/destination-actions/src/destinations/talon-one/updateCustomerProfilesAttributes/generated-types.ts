// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An array of JSON objects that contains customer profile identifier and list of attributes and their values. Customer profile ID is required.
   */
  data: {
    /**
     * The customer profile integration identifier to use in Talon.One.
     */
    customerProfileId: string
    /**
     * Extra attributes associated with the customer profile. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
     */
    attributes?: {
      [k: string]: unknown
    }
  }[]
  /**
   * This may contain mutual list of attributes and their values for every customer profile in the "data" array.
   */
  mutualAttributes?: {
    [k: string]: unknown
  }
}
