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
  }
  /**
   * A unique identifier assigned to a specific audience in Segment.
   */
  computation_key: string
  /**
   * The timestamp of when the event occurred.
   */
  timestamp: string | number
  /**
   * A delay of the selected seconds will be added before retrying a failed request.
   *                     Max delay allowed is 600 secs (10 mins). The default is 0 seconds.
   */
  retry?: number
}
