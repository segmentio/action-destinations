// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * IAM role ARN with write permissions to the S3 bucket. Format: arn:aws:iam::account-id:role/role-name
   */
  iam_role_arn: string
  /**
   * Name of the S3 bucket where the files will be uploaded to.
   */
  s3_aws_bucket_name: string
  /**
   * Region Code where the S3 bucket is hosted. See [AWS S3 Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-regions)
   */
  s3_aws_region: string
  /**
   * The External ID to your IAM role. Generate a secure string and treat it like a password.
   */
  iam_external_id: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Name of the S3 Subfolder where the files will be uploaded to. e.g. segmentdata/ or segmentdata/audiences/
   */
  s3_aws_folder_name?: string
  /**
   * Prefix to append to the name of the uploaded file. A lower cased audience name and timestamp will be appended by default to the filename to ensure uniqueness.
   *                     Format: <PREFIX>_<AUDIENCE NAME>_<TIMESTAMP>.csv
   */
  filename?: string
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
}
