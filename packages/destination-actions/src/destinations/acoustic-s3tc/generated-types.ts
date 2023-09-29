// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Use your Acoustic Org name but replace any spaces with an underscore, eg., AcmeCustomer_Prod
   */
  fileNamePrefix: string
  /**
   * The Alias of the Access Point created for your access to the S3 Bucket.
   */
  s3_bucket_accesspoint_alias: string
  /**
   * S3 Access Key for the S3 bucket.
   */
  s3_access_key: string
  /**
   * S3 Secret credential for the S3 bucket.
   */
  s3_secret: string
  /**
   * Should always be us-east-1 unless directed by Acoustic otherwise.
   */
  s3_region: string
  /**
   *
   *
   * Last-Modified: 09.19.2023 10.30.43
   *
   *
   */
  version?: string
}
