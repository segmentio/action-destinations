// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The units of the goal to track. Mapping of unit name to source property in the event payload. Create Units in the Settings -> Units section of the ABsmartly Web Console
   */
  units: {
    [k: string]: unknown
  }
  /**
   * The name of the goal to track
   */
  name: string
  /**
   * Exact timestamp when the goal sent (measured by the client clock). Must be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number
   */
  publishedAt: string | number
  /**
   * Exact timestamp when the goal was achieved (measured by the client clock). Must be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number
   */
  achievedAt: string | number
  /**
   * Custom properties of the goal
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Optional agent identifier that originated the event. Used to identify which SDK generated the event.
   */
  agent?: string
  /**
   * Optional application name that originated this event. Must exist if not empty. Create Applications in the Settings -> Applications section of the ABsmartly Web Console
   */
  application?: string
  /**
   * Forward experiment exposure events tracked through Segment.io to ABsmartly. Useful if you want to replace the direct flow of exposure events from the ABsmartly SDK to the ABsmartly collector, by instead sending them to Segment.io for processing by the destination action.
   */
  exposuresTracking?: boolean
  /**
   * The event name which should be forwarded to ABsmartly as an exposure instead of a goal when Track Exposures is on, or to be ignored when Track Exposures is off.
   */
  exposureEventName?: string
  /**
   * The verbatim ABsmartly exposure payload. Required when Track Exposures is on.
   */
  exposure?: {
    [k: string]: unknown
  }
}
