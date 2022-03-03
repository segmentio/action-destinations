// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This will be sent to Adobe Target as an event parameter called "event_name".
   */
  event_name?: string
  /**
   * The event type. Please ensure the type entered here is registered and available.
   */
  type?: string
  /**
   * Parameters specific to the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
