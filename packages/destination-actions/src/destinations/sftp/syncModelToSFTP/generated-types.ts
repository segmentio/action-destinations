// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Column headers to write to files sent to SFTP.
   */
  columns: {
    [k: string]: unknown
  }
  /**
   * Prefix to prepend to the name of the uploaded file. Timestamp will be appended to the filename.
   */
  filename_prefix: string
  /**
   * File extension for the uploaded file.
   */
  file_extension: string
  /**
   * Character used to separate tokens in the resulting file.
   */
  delimiter: string
  /**
   * Path within the SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.
   */
  sftp_folder_path: string
  /**
   * Enable Batching Hidden Field
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * Specify the column name to store the batch size when the event is sent to SFTP. Leave blank if no column is required
   */
  batch_size_column_name?: string
  /**
   * Enable concurrent writes when uploading files to SFTP. Improves performance for large files.
   */
  useConcurrentWrites?: boolean
}
