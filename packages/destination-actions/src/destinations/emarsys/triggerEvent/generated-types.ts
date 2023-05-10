// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Id of the external event
   */
  eventid: number
  /**
   * The field to use to find the contact
   */
  key_field: string
  /**
   * Value for the key field used to find the contact. E.g. the email address
   */
  key_value: string
  /**
   * A JSON object that will be passed to the Emarsys template engine and can be used for personalization
   */
  event_payload?: {
    [k: string]: unknown
  } | null
}
