// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A dynamic field dropdown which fetches all adAccounts.
   */
  adAccountId: string
  /**
   * Epoch timestamp in milliseconds at which the conversion event happened. If your source records conversion timestamps in second, insert 000 at the end to transform it to milliseconds.
   */
  conversionHappenedAt: string
  /**
   * The monetary value for this conversion. Example: {“currencyCode”: “USD”, “amount”: “50.0”}.
   */
  conversionValue?: {
    /**
     * ISO format
     */
    currencyCode: string
    /**
     * Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.
     */
    amount: string
  }
  /**
   * Will be used for deduplication in future.
   */
  eventId?: string
  /**
   * Either userIds or userInfo is required. List of one or more identifiers to match the conversion user with objects containing "idType" and "idValue".
   */
  userIds?: {
    /**
     * Valid values are: SHA256_EMAIL, LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID, ACXIOM_ID, ORACLE_MOAT_ID
     */
    idType: string
    /**
     * The value of the identifier.
     */
    idValue: string
  }[]
  /**
   * Object containing additional fields for user matching.
   */
  userInfo?: {
    firstName?: string
    lastName?: string
    companyName?: string
    title?: string
    countryCode?: string
  }
  /**
   * A dynamic field dropdown which fetches all active campaigns.
   */
  campaignId: string
}
// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  onMappingSave: {
    inputs?: {
      /**
       * The ID of an existing conversion rule to stream events to. If defined, we will not create a new conversion rule.
       */
      conversionRuleId?: string
      /**
       * The name of the conversion rule.
       */
      name: string
      /**
       * The type of conversion rule.
       */
      conversionType: string
      /**
       * The attribution type for the conversion rule.
       */
      attribution_type: string
    }
    outputs?: {
      /**
       * The ID of the conversion rule.
       */
      id: string
      /**
       * The name of the conversion rule.
       */
      name: string
      /**
       * The type of conversion rule.
       */
      conversionType: string
    }
  }
}
