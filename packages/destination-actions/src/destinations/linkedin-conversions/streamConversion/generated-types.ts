// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ad account to use for the conversion event.
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
   * The unique id for each event. This field is optional and is used for deduplication.
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
   * Select one or more advertising campaigns from your ad account to associate with the configured conversion rule.
   */
  campaignId: string[]
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
      name?: string
      /**
       * The type of conversion rule.
       */
      conversionType?: string
      /**
       * The attribution type for the conversion rule.
       */
      attribution_type?: string
      /**
       * Conversion window timeframe (in days) of a member clicking on a LinkedIn Ad (a post-click conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 30.
       */
      post_click_attribution_window_size?: number
      /**
       * 	Conversion window timeframe (in days) of a member seeing a LinkedIn Ad (a view-through conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 7.
       */
      view_through_attribution_window_size?: number
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
      /**
       * The attribution type for the conversion rule.
       */
      attribution_type: string
      /**
       * Conversion window timeframe (in days) of a member clicking on a LinkedIn Ad (a post-click conversion) within which conversions will be attributed to a LinkedIn ad.
       */
      post_click_attribution_window_size: number
      /**
       * Conversion window timeframe (in days) of a member seeing a LinkedIn Ad (a view-through conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 7.
       */
      view_through_attribution_window_size: number
    }
  }
}
