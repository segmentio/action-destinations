// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
   * Email address of the contact associated with the conversion event. Segment will hash this value before sending it to LinkedIn. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.
   */
  email?: string
  /**
   * First party cookie or Click Id. Enhanced conversion tracking must be enabled to use this ID type. See [LinkedIn documentation](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/conversions-api?view=li-lms-2024-01&tabs=http#idtype) for more details. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.
   */
  linkedInUUID?: string
  /**
   * User identifier for matching with LiveRamp identity graph. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.
   */
  acxiomID?: string
  /**
   * User identifier for matching with Oracle MOAT Identity. Also known as ORACLE_MOAT_ID in LinkedIn documentation. One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.
   */
  oracleID?: string
  /**
   * Object containing additional fields for user matching. If this object is defined, both firstName and lastName are required.
   */
  userInfo?: {
    firstName: string
    lastName: string
    companyName?: string
    title?: string
    countryCode?: string
  }
  /**
   * Enable batching of requests.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  onMappingSave: {
    inputs?: {
      /**
       * The ad account to use when creating the conversion event. (When updating a conversion rule after initially creating it, changes to this field will be ignored. LinkedIn does not allow Ad Account IDs to be updated for a conversion rule.)
       */
      adAccountId: string
      /**
       * Select one or more advertising campaigns from your ad account to associate with the configured conversion rule. Segment will only add the selected campaigns to the conversion rule. Deselecting a campaign will not disassociate it from the conversion rule.
       */
      campaignId?: string[]
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
       * Conversion window timeframe (in days) of a member seeing a LinkedIn Ad (a view-through conversion) within which conversions will be attributed to a LinkedIn ad. Allowed values are 1, 7, 30 or 90. Default is 7.
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
