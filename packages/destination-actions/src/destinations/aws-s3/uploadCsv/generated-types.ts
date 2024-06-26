// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * IAM role ARN with write permissions to the S3 bucket. Format: arn:aws:iam::account-id:role/role-name
   */
  iam_role_arn: string
  /**
   * Name of the S3 bucket where the files will be uploaded to.
   */
  s3_aws_bucket_name?: string
  /**
   * Name of the S3 Subfolder where the files will be uploaded to. "/" must exist at the end of the folder name.
   */
  s3_aws_folder_name?: string
  /**
   * Region where the S3 bucket is hosted.
   */
  s3_aws_region?: string
  /**
   * Check if the data being uploaded is audience data. This is required for sending audiences to S3
   */
  is_audience: boolean
  /**
   * Additional data pertaining to the user to be written to the file.
   */
  identifier_data?: {
    [k: string]: unknown
  }
  /**
   * Additional data pertaining to the user to be hashed before written to the file. Use field name **phone_number** or **email** to apply LiveRamp's specific hashing rules.
   */
  unhashed_identifier_data?: {
    [k: string]: unknown
  }
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * Name of the CSV file to upload. If .csv is not included in the filename, it will be appended automatically.
   *       A timestamp will be appended to the filename to ensure uniqueness.
   */
  filename: string
  /**
   * A unique identifier assigned to a specific audience in Segment.
   */
  computation_key?: string
  /**
   * Hidden field used to access traits or properties objects from Engage payloads.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Hidden field used to verify that the payload is generated by an Audience. Payloads not containing computation_class = 'audience' will be dropped before the perform() fuction call.
   */
  computation_class?: string
  /**
   * Receive events in a batch payload. This is required for LiveRamp audiences ingestion.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
