// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Record data that represents field names and corresponding values for each profile.
   */
  recipientData: {
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
  }
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
   * This value must be specified as either OPTIN or OPTOUT. It defaults to the value defined in this destination settings.
   */
  default_permission_status?: string
}
