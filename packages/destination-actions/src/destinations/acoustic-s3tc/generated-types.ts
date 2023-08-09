// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Pod Number for API Endpoint
   */
  pod: string
  /**
   * Region for API Endpoint, either US, EU, AP, or CA
   */
  region: string
  /**
   * The Segment Table Name in Acoustic Campaign Data dialog.
   */
  tableName: string
  /**
   * The Segment Table List Id from the Database-Relational Table dialog in Acoustic Campaign
   */
  tableListId: string
  /**
   * The Client Id from the App definition dialog in Acoustic Campaign
   */
  a_clientId: string
  /**
   * The Client Secret from the App definition dialog in Acoustic Campaign
   */
  a_clientSecret: string
  /**
   * The RefreshToken provided when defining access for the App in Acoustic Campaign
   */
  a_refreshToken: string
  /**
   * A safety against mapping too many attributes into the Event, ignore Event if number of Event Attributes exceeds this maximum. Note: Before increasing the default max number, consult the Acoustic Destination documentation.
   */
  attributesMax?: number
  /**
   *
   * Last-Modified: 08.09.2023 16.22.49
   *
   */
  version?: string
  /**
   * Choose transport option(default S3)
   */
  tcSend: string
  /**
   * Write permission to the S3 bucket.
   */
  s3_access_key?: string
  /**
   * Write permission to the S3 bucket.
   */
  s3_secret?: string
  /**
   * Name of the S3 bucket where the files will be uploaded to.
   */
  s3_bucket_name?: string
  /**
   * eg: us-east-1, us-east-2
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
   * Stored File Name
   */
  storedFile?: string
  __segment_internal_engage_force_full_sync: boolean
  __segment_internal_engage_batch_sync: boolean
}
