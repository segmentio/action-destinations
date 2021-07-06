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
   * The event parameters to send to Google
   */
  params?: {
    [k: string]: unknown
  }
}
