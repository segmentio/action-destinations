// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The hostname or IP address of the SFTP server
   */
  sftp_host: string
  /**
   * The port number for the SFTP connection
   */
  sftp_port?: number
  /**
   * User credentials for establishing an SFTP connection
   */
  sftp_username: string
  /**
   * User credentials for establishing an SFTP connection
   */
  sftp_password: string
  /**
   * Path within the SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.
   */
  sftp_folder_path: string
  /**
   * Unique ID that identifies members of an audience. A typical audience key might be client customer IDs, email addresses, or phone numbers.
   */
  audience_key: string
  /**
   * Additional data pertaining to the user to be written to the file.
   */
  identifier_data?: {
    [k: string]: unknown
  }
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * Name of the CSV file to upload via SFTP. For multiple subscriptions, make sure to use a unique filename for each subscription.
   */
  filename: string
  /**
   * Receive events in a batch payload. This is recommended for SFTP uploads.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
