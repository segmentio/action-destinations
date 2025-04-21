// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event data to send to Amazon EventBridge.
   */
  data: {
    [k: string]: unknown
  }
  /**
   * Detail Type of the event. Used to determine what fields to expect in the event Detail.
   *                     Value cannot be longer than 128 characters.
   */
  detailType: string
  /**
   * The source ID for the event. HIDDEN FIELD
   */
  sourceId: string
  /**
   * AWS resources, identified by Amazon Resource Name (ARN),
   *                     which the event primarily concerns. Any number,
   *                     including zero, may be present.
   */
  resources?: string
  /**
   * The timestamp the event occurred.
   */
  time?: string
  /**
   * Enable Batching
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch.
   *                     Actual batch sizes may be lower.
   */
  batch_size?: number
}
