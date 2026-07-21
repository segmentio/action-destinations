// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The type of authentication to use for the SFTP connection
   */
  auth_type: string
  /**
   * The hostname or IP address of the SFTP server
   */
  sftp_host: string
  /**
   * The port number for the SFTP connection
   */
  sftp_port?: number
  /**
   * Username for establishing an SFTP connection
   */
  sftp_username: string
  /**
   * Password for establishing an SFTP connection
   */
  sftp_password?: string
  /**
   * SSH Key for establishing an SFTP connection
   */
  sftp_ssh_key?: string
  /**
   * Select the upload strategy to use when uploading files to the SFTP server.
   */
  uploadStrategy?: string
}
