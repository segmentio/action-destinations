// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * IAM user credentials with write permissions to the S3 bucket.
   */
  s3_aws_access_key?: string
  /**
   * IAM user credentials with write permissions to the S3 bucket.
   */
  s3_aws_secret_key?: string
  /**
   * Name of the S3 bucket where the files will be uploaded to.
   */
  s3_aws_bucket_name?: string
  /**
   * Region where the S3 bucket is hosted.
   */
  s3_aws_region?: string
  /**
   * Identifies the user within the entered audience.
   */
  audience_key: string
  /**
   * Additional data pertaining to the user to be written to the file.
   */
  identifier_data?: {
    [k: string]: unknown
  }
  /**
   * Additional data pertaining to the user to be hashed before written to the file
   */
  unhashed_identifier_data?: {
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
