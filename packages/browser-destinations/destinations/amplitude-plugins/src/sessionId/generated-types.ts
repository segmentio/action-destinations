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
  /**
   * If enabled, attribution details will be captured from the URL and attached to every Amplitude browser based event.
   */
  enableAutocaptureAttribution?: boolean
  /**
   * A list of hostnames to ignore when capturing attribution data. If the current page referrer matches any of these hostnames, no attribution data will be captured from the URL.
   */
  excludeReferrers?: string[]
}
