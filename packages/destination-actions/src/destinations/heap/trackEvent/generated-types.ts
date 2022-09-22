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
   * The name of the event. Limited to 1024 characters.
   */
  event: string
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
   * A Heap session ID. The session ID can be retrived by calling getSessionId() on the heap api. If a session ID is not provided one will be created.
   */
  session_id?: string
}
