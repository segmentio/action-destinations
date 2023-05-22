// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Choose delivery route for the files
   */
  upload_mode: string
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
   * User credentials for establishing an SFTP connection with LiveRamp.
   */
  sftp_username?: string
  /**
   * User credentials for establishing an SFTP connection with LiveRamp.
   */
  sftp_password?: string
  /**
   * Path within the LiveRamp SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.
   */
  sftp_folder_path?: string
}
