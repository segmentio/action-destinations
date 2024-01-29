// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Record data that represents Field Names and corresponding values for the Recipient.
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
   * Not needed for Segment Destination, thus hidden: The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.
   */
  mapTemplateName: string
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
