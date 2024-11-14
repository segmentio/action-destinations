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
     * Recipient ID (RIID). RIID is required if Email Address is empty.
     */
    RIID_?: string
  }
  /**
   * The name of the folder where the new Profile Extension Table will be created.
   */
  folder_name: string
  /**
   * The PET (Profile Extension Table) name. The default value is the audience key in Segment.
   */
  pet_name: string
  /**
   * A unique identifier assigned to a specific audience in Segment.
   */
  computation_key: string
  /**
   * Hidden field used to access traits or properties objects from Engage payloads.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * The timestamp of when the event occurred.
   */
  timestamp?: string | number
  /**
   * A delay of the selected seconds will be added before retrying a failed request.
   *                     Max delay allowed is 600 secs (10 mins). The default is 0 seconds.
   */
  retry?: number
}
