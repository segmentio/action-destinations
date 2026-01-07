// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Enable batching of requests to Memora. Batches can contain up to 1000 profiles.
   */
  enable_batching?: boolean
  /**
   * Maximum number of profiles to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The Memora Store ID to use for this profile. This should be a valid Memora Store associated with your Twilio account.
   */
  memora_store: string
  /**
   * Contact information object containing email, firstName, lastName, and phone fields that will be placed in the Contact trait group in the Memora API call.
   */
  contact?: {
    /**
     * User email address
     */
    email?: string
    /**
     * User first name
     */
    firstName?: string
    /**
     * User last name
     */
    lastName?: string
    /**
     * User phone number
     */
    phone?: string
    [k: string]: unknown
  }
}
