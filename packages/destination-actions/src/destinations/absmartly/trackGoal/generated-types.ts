// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The units of the goal to track. Mapping of unit name to source property in the event payload. Create Units in the Settings > Units section of the ABsmartly Web Console
   */
  units: {
    [k: string]: unknown
  }
  /**
   * The name of the goal to track
   */
  name: string
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
   * Optional application name that originated this event. Must exist if not empty. Create Applications in the Settings > Applications section of the ABsmartly Web Console
   */
  application?: string
}
