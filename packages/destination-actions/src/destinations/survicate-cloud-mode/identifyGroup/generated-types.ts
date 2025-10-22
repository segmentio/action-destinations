// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The group id
   */
  groupId: string
  /**
   * The Segment traits to be forwarded to Survicate
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event. Defaults to current time if not provided
   */
  timestamp?: string
}
