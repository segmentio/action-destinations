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
     * Name of column for the unique identifier for the Segment Engage Space that generated the event.
     */
    space_id?: string
    /**
     * Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment
     */
    integrations_object?: string
    /**
     * Name of column for properties and traits. This data contains the entire properties object from a track() call or the traits object from an identify() call emitted from Engage when a user is added to or removed from an Audience
     */
    properties_or_traits?: string
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
  integrationsObject: {
    [k: string]: unknown
  }
  /**
   * Properties or Traits Hidden Field
   */
  propertiesOrTraits: {
    [k: string]: unknown
  }
  /**
   * Context Hidden Field
   */
  context: {
    [k: string]: unknown
  }
  /**
   * Event-specific properties that can be included in emails triggered by this event.
   */
  eventProperties?: {
    [k: string]: unknown
  }
  /**
   * The properties of the user
   */
  userTraits?: {
    [k: string]: unknown
  }
  /**
   * Name of the event.
   */
  eventName?: string
  /**
   * The type of event
   */
  eventType: string
  /**
   * Additional user identifiers and traits to include as separate columns in the CSV file. Each item should contain a key and a value. The key is the trait or identifier name from the payload, and the value is the column name to be written to the CSV file.
   */
  additional_identifiers_and_traits_columns?: {
    [k: string]: unknown
  }
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
   * Prefix to append to the name of the uploaded file. A lower cased audience name and timestamp will be appended by default to the filename to ensure uniqueness.
   *                       Format: <PREFIX>_<AUDIENCE NAME>_<TIMESTAMP>.csv
   */
  filename?: string
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
}
