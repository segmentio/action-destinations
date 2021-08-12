// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of the person who triggered this event.
   */
  id?: string
  /**
   * Anonymous ID of the person who triggered this event.
   */
  anonymous_id?: string
  /**
   * Name of the event
   */
  name: string
  /**
   * Override event type. Ex. "page".
   */
  type?: string
  /**
   * Custom data to include with the event.
   */
  data?: {
    [k: string]: unknown
  }
}
