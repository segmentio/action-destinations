// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event.
   */
  eventName: string
  /**
   * JSON object containing additional properties that will be associated with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * A user’s unique visitor ID. Setting this allows .
   */
  userId?: string
}
