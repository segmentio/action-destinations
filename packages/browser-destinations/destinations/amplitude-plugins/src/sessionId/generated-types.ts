// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Time in milliseconds to be used before considering a session stale.
   */
  sessionLength?: number
  /**
   * if set to true, 'Session Started' and 'Session Ended' events will be triggered from the user's browser. These events will be forwarded to all connected Destinations.
   */
  triggerSessionEvents?: boolean
  /**
   * The event name to use for the session start event.
   */
  sessionStartEvent?: string
  /**
   * The event name to use for the session end event.
   */
  sessionEndEvent?: string
}
