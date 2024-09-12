// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Column names to write to S3 CSV file.
   */
  columns: {
    /**
     * Name of column for email address
     */
    email?: string
    /**
     * Name of column for user ID
     */
    user_id?: string
    /**
     * Name of column for anonymous ID
     */
    anonymous_id?: string
    /**
     * Name of column for timestamp for when the user was added or removed from the Audience
     */
    timestamp?: string
    /**
     * Name of column for the unique identifier for the message.
     */
    message_id?: string
    /**
     * Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment
     */
    integrations_object?: string
    /**
     * Name of column for the unique identifier for the Segment Engage Space that generated the event.
     */
    space_id?: string
    /**
     * Name of column for the track() properties.
     */
    all_event_properties?: string
    /**
     * Name of column for the track() or identify() user traits.
     */
    all_user_traits?: string
    /**
     * Name of the event.
     */
    eventName?: string
    /**
     * The type of event
     */
    eventType?: string
  }
  /**
   * Email Hidden Field
   */
  email?: string
  /**
   * User ID Hidden Field
   */
  userId?: string
  /**
   * Anonymous ID Hidden Field
   */
  anonymousId?: string
  /**
   * Timestamp Hidden Field
   */
  timestamp: string | number
  /**
   * Message ID Hidden Field
   */
  messageId: string
  /**
   * Integrations Object Hidden Field
   */
  integrationsObject?: {
    [k: string]: unknown
  }
  /**
   * Space ID Hidden Field
   */
  spaceId?: string
  /**
   * Properties Hidden Field
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * All User Traits Hidden Field
   */
  user_traits?: {
    [k: string]: unknown
  }
  /**
   * Context Hidden Field
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The properties of the event. Each item will be written to a separate column.
   */
  eventProperties?: {
    [k: string]: unknown
  }
  /**
   * The properties of the user. Each item will be written to a separate column.
   */
  userTraits?: {
    [k: string]: unknown
  }
  /**
   * Event Name Hidden Field.
   */
  eventName?: string
  /**
   * Event Type Hidden Field
   */
  eventType: string
  /**
   * Receive events in a batch payload. This is required for LiveRamp audiences ingestion.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * Name of the S3 Subfolder where the files will be uploaded to. e.g. segmentdata/ or segmentdata/audiences/
   */
  s3_aws_folder_name?: string
  /**
   * Prefix to append to the name of the uploaded file. A lower cased audience name and timestamp will be appended by default to the filename to ensure uniqueness. Format: <PREFIX>_<AUDIENCE NAME>_<TIMESTAMP>.csv
   */
  filename?: string
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * File extension for the uploaded file.
   */
  file_extension: string
}
