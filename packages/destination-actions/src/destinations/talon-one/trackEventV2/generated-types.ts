// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Indicates whether to skip non-existing attributes. If `Yes`, the non-existing attributes are skipped and a 400 error is not returned. If `No`, a 400 error is returned in case of non-existing attributes.
   */
  skipNonExistingAttributes?: boolean
  /**
   * The customer profile integration ID to use in Talon.One. It is the identifier of the customer profile associated to the event.
   */
  customerProfileId: string
  /**
   * The name of the event sent to Talon.One.
   */
  eventType: string
  /**
   * Extra attributes associated with the event. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
   */
  attributes?: {
    [k: string]: unknown
  }
}
