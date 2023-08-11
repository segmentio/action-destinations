// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Choose transport option, S3 is the default
   */
  cacheType: string
  /**
   * Prefix to all Stored File Names
   */
  fileNamePrefix?: string
  /**
   * Write permission to the S3 bucket.
   */
  s3_access_key?: string
  /**
   * Write permission to the S3 bucket.
   */
  s3_secret?: string
  /**
   * An Access Point created as access to the S3 bucket.
   */
  s3_bucket?: string
  /**
   * See S3 definition, should be eg: us-east-1, us-east-2
   */
  s3_region?: string
  /**
   * Acoustic credentials for the SFTP connection
   */
  sftp_user?: string
  /**
   * Acoustic credentials for the SFTP connection
   */
  sftp_password?: string
  /**
   * Acoustic Campaign SFTP folder path.
   */
  sftp_folder?: string
  /**
   *
   *
   * Last-Modified: 08.11.2023 11.39.21
   *
   *
   */
  version?: string
  /**
   * Force full sync of an Audience versus receiving Audience updates as they occur.
   */
  __segment_internal_engage_force_full_sync: boolean
  /**
   * Force Batch mode Event updates versus singular Event updates as they occur.
   */
  __segment_internal_engage_batch_sync: boolean
}
