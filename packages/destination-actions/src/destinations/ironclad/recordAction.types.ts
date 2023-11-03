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
   * The ID of the Clickwrap Group associated with the acceptance event. Needs to be an integer
   */
  group_id: number
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
   * Optional, located in the properties object, used to attach custom data to your Activity. The example is URL encoded for { "first name": "Eric" } Using this in an updated activity will append the data to the signer, otherwise it will be added to the specific activity call/transaction.
   */
  customData?: {
    [k: string]: unknown
  }
}
