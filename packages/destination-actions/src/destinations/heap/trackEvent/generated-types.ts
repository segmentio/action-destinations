// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique event ID generated by Segment.
   */
  message_id: string
  /**
   * An identity, typically corresponding to an existing user. If no such identity exists, then a new user will be created with that identity. Case-sensitive string, limited to 255 characters.
   */
  identity?: string | null
  /**
   * The generated anonymous ID for the user.
   */
  anonymous_id?: string | null
  /**
   * Name of the user action. This only exists on track events. Limited to 1024 characters.
   */
  event?: string
  /**
   * An object with key-value properties you want associated with the event. Each key and property must either be a number or string with fewer than 1024 characters.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Defaults to the current time if not provided.
   */
  timestamp?: string | number
  /**
   * The name of the SDK used to send events
   */
  library_name?: string
  /**
   * The type of event
   */
  type: string
  /**
   * The name of the page or screen being viewed. This only exists for page and screen events.
   */
  name?: string
}
