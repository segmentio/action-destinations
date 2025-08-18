// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Time in milliseconds to be used before considering a session stale.
   */
  sessionLength?: number
  /**
   * Generate session start and session end events. This is useful for tracking user sessions.
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
