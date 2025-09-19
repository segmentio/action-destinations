// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Time in milliseconds to be used before considering a session stale.
   */
  sessionLength?: number
  /**
   * Generate session start and session end track() events. These events will be sent to the Javascript Source and will be forwarded on to any connected Destinations.
   */
  allowSessionTracking?: boolean
  /**
   * The event name to use for the session start event.
   */
  sessionStartEvent?: string
  /**
   * The event name to use for the session end event.
   */
  sessionEndEvent?: string
}
