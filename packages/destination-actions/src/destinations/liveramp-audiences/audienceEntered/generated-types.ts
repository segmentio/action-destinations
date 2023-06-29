// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifies the user within the entered audience.
   */
  audience_key: string
  /**
   * Additional data pertaining to the user.
   */
  identifier_data?: {
    [k: string]: unknown
  }
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * Name of the CSV file to upload for LiveRamp ingestion.
   */
  filename: string
  /**
   * Receive events in a batch payload. This is required for LiveRamp audiences ingestion.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
