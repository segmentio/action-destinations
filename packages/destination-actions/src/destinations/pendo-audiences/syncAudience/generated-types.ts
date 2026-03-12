// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Pendo Visitor ID for the user. Maps to the userId in Segment by default.
   */
  visitorId: string
  /**
   * Traits or Properties object from the identify() or track() call emitted by Engage.
   */
  traitsOrProperties: {
    [k: string]: unknown
  }
  /**
   * Segment Audience Key. Used to determine whether the user is being added to or removed from the Pendo Segment.
   */
  segmentAudienceKey: string
  /**
   * The External Audience ID from Segment, which maps to the Pendo Segment ID.
   */
  segmentAudienceId: string
  /**
   * When enabled, events are batched and sent to Pendo using the batch patch endpoint (up to 1000 visitors per request).
   */
  enable_batching: boolean
  /**
   * Maximum number of visitors to include in a single batch request. Must be between 1 and 1000.
   */
  batch_size?: number
}
