// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Column write to the S3 CSV file.
   */
  columns: {
    /**
     * Name of the event.
     */
    event_name?: string
    /**
     * The type of event
     */
    event_type?: string
    /**
     * User ID
     */
    user_id?: string
    /**
     * Anonymous ID
     */
    anonymous_id?: string
    /**
     * Email address
     */
    email?: string
    /**
     * Properties of the event
     */
    properties?: {
      [k: string]: unknown
    }
    /**
     * User traits
     */
    traits?: {
      [k: string]: unknown
    }
    /**
     * Context of the event
     */
    context?: {
      [k: string]: unknown
    }
    /**
     * Timestamp of the event
     */
    timestamp?: string
    /**
     * Name of column for the unique identifier for the message.
     */
    message_id?: string
    /**
     * Name of column for the Integration Object. This contains JSON details of which destinations the event was synced to by Segment
     */
    integrations?: {
      [k: string]: unknown
    }
    /**
     * Name of the audience
     */
    audience_name?: string
    /**
     * ID of the audience
     */
    audience_id?: string
    /**
     * ID of the Engage Space where the Audience was generated
     */
    audience_space_id?: string
    [k: string]: unknown
  }
  /**
   * Name of the column that will contain the action for the audience. true if the user is in the audience, false if not.
   */
  audience_action_column_name?: string
  /**
   * Specify the column name to store the batch size when the event is sent to S3. Leave blank if no column is required
   */
  batch_size_column_name?: string
  /**
   * Field used to retrieve Audience value
   */
  traits_or_props?: {
    [k: string]: unknown
  }
  /**
   * Field used to retrieve Audience Key
   */
  computation_key?: string
  /**
   * Enable Batching Hidden Field
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower. Max batch size is 10000.
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
