// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * event Context
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * A user profile's traits
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * Event Integrations field
   */
  integrations?: {
    [k: string]: unknown
  }
  /**
   * Customer User ID in Segment
   */
  userId?: string
  /**
   * Customer Anonymous ID in Segment
   */
  anonymousId?: string
  /**
   * The Engage/Personas space Write Key
   */
  writeKey?: string
}
