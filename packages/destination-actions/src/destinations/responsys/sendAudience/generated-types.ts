// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * <TODO>>
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
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number,

  traits_or_props: {
    [k: string]: unknown
  },

  computation_key: string,

  computation_class: string,
}
