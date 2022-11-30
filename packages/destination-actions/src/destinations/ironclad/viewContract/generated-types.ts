// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier used to save your signer’s signature. Can be email, mobile number, UUID, or any integer. Should be URL encoded
   */
  sig: string
  /**
   * The name of the event coming from the source, this will get translated into the Group Key and event type before the call goes to Ironclad
   */
  event_name: string
  /**
   * The Key of the Group associated with the acceptance event
   */
  group_key: string
  /**
   *  The type of event being logged. Default values are displayed, updated, agreed, visited, sent, and disagreed
   */
  event_type: string & string[]
}
