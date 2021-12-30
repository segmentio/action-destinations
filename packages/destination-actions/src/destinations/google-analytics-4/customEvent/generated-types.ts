// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Uniquely identifies a user instance of a web client.
   */
  clientId: string
  /**
   * The unique name of the custom event created in GA4.
   */
  name: string
  /**
   * If set to true, event name will be converted to lowercase before sending to Google.
   */
  lowercase?: boolean
  /**
   * The event parameters to send to Google
   */
  params?: {
    [k: string]: unknown
  }
}
