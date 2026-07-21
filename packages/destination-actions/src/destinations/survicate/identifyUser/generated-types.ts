// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  user_id?: string
  /**
   * An anonymous id
   */
  anonymous_id?: string
  /**
   * The Segment traits to be forwarded to Survicate
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event.
   */
  timestamp: string
}
