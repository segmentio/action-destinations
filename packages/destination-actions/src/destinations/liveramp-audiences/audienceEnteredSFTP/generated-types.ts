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
   * User credentials for establishing an SFTP connection with LiveRamp.
   */
  sftp_username: string
  /**
   * User credentials for establishing an SFTP connection with LiveRamp.
   */
  sftp_password: string
  /**
   * Path within the SFTP server to upload the files to.
   */
  sftp_folder_path: string
}
