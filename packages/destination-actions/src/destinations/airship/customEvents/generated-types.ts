// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User
   */
  user?: string
  /**
   * Event Name
   */
  name: string
  /**
   * When the event occurred.
   */
  occurred: string | number
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
}
