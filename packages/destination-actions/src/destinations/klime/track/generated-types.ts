// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the event
   */
  messageId: string
  /**
   * Name of the event being tracked
   */
  event: string
  /**
   * Unique identifier for the user
   */
  userId?: string
  /**
   * Unique identifier for the group/organization
   */
  groupId?: string
  /**
   * Additional properties for the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * When the event occurred (ISO 8601)
   */
  timestamp?: string | number
  /**
   * Contextual information about the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * When enabled, events are sent in batches.
   */
  enable_batching: boolean
  /**
   * Maximum number of events per batch request.
   */
  batch_size?: number
}
