// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Record data that represents field names and corresponding values for each profile.
   */
  userData: {
    /**
     * The user's email address.
     */
    EMAIL_ADDRESS_?: string
    /**
     * An MD5 Hash of the user's email address.
     */
    email_md5_hash_?: string
    /**
     * A SHA256 Hash of the user's email address.
     */
    email_sha256_hash_?: string
    /**
     * Recipient ID (RIID).  RIID is required if Email Address is empty.
     */
    RIID_?: string
    /**
     * Responsys Customer ID.
     */
    CUSTOMER_ID_?: string
    /**
     * The user's Mobile Phone Number.
     */
    mobile_number_?: string
    [k: string]: unknown
  }
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
