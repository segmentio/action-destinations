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
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Name of the S3 Subfolder where the files will be uploaded to. "/" must exist at the end of the folder name.
   */
  s3_aws_folder_name?: string
  /**
   * Prefix to append to the name of the uploaded file. A timestamp and lower cased audience name will be appended to the filename to ensure uniqueness.
   */
  filename?: string
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
}
