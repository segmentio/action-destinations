// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Column names to write to S3 CSV file.
   */
  columns: {
    /**
     * Name of column for user ID
     */
    user_id_header?: string
    /**
     * Name of column for anonymous ID
     */
    anonymous_id_header?: string
    /**
     * Name of column for timestamp for when the user was added or removed from the Audience
     */
    timestamp_header?: string
    /**
     * Name of column for the unique identifier for the message.
     */
    message_id_header?: string
    /**
     * Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment
     */
    integrations_object_header?: string
    /**
     * Name of column for the track() properties.
     */
    all_event_properties_header?: string
    /**
     * Name of column for the track() or identify() user traits.
     */
    all_user_traits_header?: string
    /**
     * Name of the event.
     */
    event_name_header?: string
    /**
     * The type of event
     */
    event_type_header?: string
    /**
     * Name of column for the context object.
     */
    context_header?: string
  }
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
   * Properties Hidden Field
   */
  all_event_properties?: {
    [k: string]: unknown
  }
  /**
   * All User Traits Hidden Field
   */
  all_user_traits?: {
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
   * Enable Batching Hidden Field
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
   * Prefix to append to the name of the uploaded file.
   */
  filename_prefix?: string
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * File extension for the uploaded file.
   */
  file_extension: string
}
