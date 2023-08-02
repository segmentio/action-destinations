// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
