// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Yahoo MDM ID provided by Yahoo representative
   */
  mdm_id: string
  /**
   * Engage Space Id found in Unify > Settings > API Access
   */
  engage_space_id: string
  /**
   * Engage space name and description
   */
  customer_desc?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Placeholder field to allow the audience to be created. Do not change this
   */
  placeholder?: boolean
  /**
   * The monetary value for a conversion. This is an object with shape: {"currencyCode": USD", "amount": "100"}
   */
  personas: {
    /**
     * ISO format
     */
    computation_id: string
    /**
     * Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.
     */
    computation_key: string
  }
}
