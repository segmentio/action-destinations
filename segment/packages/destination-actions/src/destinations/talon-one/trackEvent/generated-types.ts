// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The customer profile integration ID to use in Talon.One. It is the identifier of the customer profile associated to the event.
   */
  customerProfileId: string
  /**
   * The name of the event sent to Talon.One.
   */
  eventType: string
  /**
   * Type of event. Can be only `string`, `time`, `number`, `boolean`, `location`
   */
  type: string
  /**
   * Extra attributes associated with the event. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
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
