// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The host of the SingleStore database.
   */
  host: string
  /**
   * The port of the SingleStore Data API. Defaults to 443.
   */
  port?: string
  /**
   * The username of the SingleStore database.
   */
  username: string
  /**
   * The password of the SingleStore database.
   */
  password: string
  /**
   * The name of the database.
   */
  dbName: string
  /**
   * The name of the table. Defaults to "segment_data".
   */
  tableName: string
}
