// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event type. Please ensure the type entered here is registered and available.
   */
  type?: string
  /**
   * This will be sent to Adobe Target as an event parameter called "event_name".
   */
  eventName?: string
  /**
   * Parameters specific to the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.
   */
  userId?: string
}
