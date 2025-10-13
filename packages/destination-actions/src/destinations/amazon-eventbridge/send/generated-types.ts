// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event data to send to Amazon EventBridge.
   */
  data: {
    [k: string]: unknown
  }
  /**
   * Detail Type of the event. Used to determine what fields to expect in the event Detail. Value cannot be longer than 128 characters.
   */
  detailType: string
  /**
   * AWS resources, identified by Amazon Resource Name (ARN), which the event primarily concerns. Any number, including zero, may be present.
   */
  resources?: string[]
  /**
   * The timestamp the event occurred. Accepts a date in ISO 8601 format.
   */
  time?: string
  /**
   * (Hidden field): Enable Batching
   */
  enable_batching: boolean
  /**
   * (Hidden field): Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The identifier for the source.
   */
  sourceId: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveInputs {}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveOutputs {
  /**
   * The identifier for the source.
   */
  sourceId: string
}
