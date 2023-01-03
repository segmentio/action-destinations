// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier used to save your signer’s signature. Can be email, mobile number, UUID, or any integer. Should be URL encoded.
   */
  sig: string
  /**
   * The name of the event coming from the source, this is an additional information field before the call goes to Ironclad.
   */
  event_name?: string
  /**
   * The ID of the Group associated with the acceptance event.
   */
  group_id: string
  /**
   * The type of event being logged, the available choices are displayed, agreed, and disagreed.
   */
  event_type: string
  /**
   * Context Parameters including page, time and other information.
   */
  contextParameters?: {
    [k: string]: unknown
  }
  /**
   * Optional. Custom Data. URL encode a JSON object to attach custom data to your Activity. The example is URL encoded for { "first name": "Eric" } Using this in an updated Activity will append the data to the Signer, otherwise it will be added to the specific Activity call/transaction.
   */
  customData?: {
    [k: string]: unknown
  }
}
