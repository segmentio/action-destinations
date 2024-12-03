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
     * Responsys Customer ID.
     */
    CUSTOMER_ID_?: string
    /**
     * Recipient ID (RIID). RIID is required if Email Address and Customer ID are empty. Only use it if the corresponding profile already exists in Responsys.
     */
    RIID_?: string
    [k: string]: unknown
  }
  /**
   * The name of the folder where the new Profile Extension Table will be created. Overrides the default folder name in Settings.
   */
  folder_name?: string
  /**
   * The PET (Profile Extension Table) name. Overrides the default Profile Extension Table name in Settings.
   */
  pet_name?: string
  /**
   * The timestamp of when the event occurred.
   */
  timestamp?: string | number
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  use_responsys_async_api?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * If true, all Recipient data will be converted to strings before being sent to Responsys.
   */
  stringify?: boolean
}
