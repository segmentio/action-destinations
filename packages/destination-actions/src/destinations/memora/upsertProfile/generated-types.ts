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
   * Contact identifiers (email and/or phone). At least one identifier is required.
   */
  contact_identifiers: {
    /**
     * User email address
     */
    email?: string
    /**
     * User phone number
     */
    phone?: string
  }
  /**
   * Contact traits for the profile. At least one trait is required. These fields are dynamically loaded from the selected Memora Store.
   */
  contact_traits: {
    [k: string]: unknown
  }
}
