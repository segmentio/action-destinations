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
   * Name of the audience the user has entered.
   */
  audience_name: string
  /**
   * Datetime at which the event was received. Used to disambiguate the resulting file.
   */
  received_at: string | number
  /**
   * IAM user credentials with write permissions to the S3 bucket.
   */
  s3_aws_access_key: string
  /**
   * IAM user credentials with write permissions to the S3 bucket.
   */
  s3_aws_secret_key: string
  /**
   * Name of the S3 bucket where the files will be uploaded to.
   */
  s3_aws_bucket_name: string
  /**
   * Region where the S3 bucket is hosted.
   */
  s3_aws_region: string
}
