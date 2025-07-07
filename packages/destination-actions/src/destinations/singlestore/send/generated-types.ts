// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for the message.
   */
  messageid: string
  /**
   * The timestamp of the event.
   */
  timestamp: string
  /**
   * The type of the event (e.g., "track", "identify", "page", "screen", "group", "alias").
   */
  type: string
  /**
   * The name of the event. Only required for "track" events.
   */
  event?: string
  /**
   * The name of the page or screen.
   */
  name?: string
  /**
   * The properties of the track, page or screen event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The user ID associated with the event.
   */
  userId?: string
  /**
   * The anonymous ID associated with the event.
   */
  anonymousId?: string
  /**
   * The group ID associated with the event.
   */
  groupId?: string
  /**
   * The traits of the user associated with the event.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The context of the event. Contains user environment information.
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The maximum number of rows to include in a batch.
   */
  max_batch_size: number
  /**
   * Batch events to SingleStore
   */
  enable_batching?: boolean
}
