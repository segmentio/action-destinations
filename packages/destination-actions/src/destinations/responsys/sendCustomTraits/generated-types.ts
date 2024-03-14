// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Record data that represents field names and corresponding values for each profile.
   */
  userData: {
    /**
     * The user's email address
     */
    EMAIL_ADDRESS_?: string
    /**
     * Responsys Customer ID.
     */
    CUSTOMER_ID_?: string
    [k: string]: unknown
  }
  /**
   * If checked, all data is converted to String before sending to Responsys;
   *                     otherwise, data is sent as is and must match to the data type in Responsys.
   *                     eg. Value 1 will be sent as 1 if unchecked and as "1" if checked.
   */
  stringify_all_data?: boolean
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The timestamp of when the event occurred.
   */
  timestamp: string | number
}
