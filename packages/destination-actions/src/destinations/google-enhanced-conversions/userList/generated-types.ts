// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's first name. If not hashed, Segment will normalize and hash this value.
   */
  first_name?: string
  /**
   * The user's last name. If not hashed, Segment will normalize and hash this value.
   */
  last_name?: string
  /**
   * The user's email address. If not hashed, Segment will normalize and hash this value.
   */
  email?: string
  /**
   * The user's phone number. If not hashed, Segment will convert the phone number to the E.164 format and hash this value.
   */
  phone?: string
  /**
   * 2-letter country code in ISO-3166-1 alpha-2 of the user's address
   */
  country_code?: string
  /**
   * Postal code of the user's address.
   */
  postal_code?: string
  /**
   * Advertiser-assigned user ID for Customer Match upload. Required if external ID type is CRM ID.
   */
  crm_id?: string
  /**
   * Mobile device ID (advertising ID/IDFA). Required if external ID type is mobile advertising ID.
   */
  mobile_advertising_id?: string
  /**
   * This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v17/Consent).
   */
  ad_user_data_consent_state: string
  /**
   * This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v17/Consent).
   */
  ad_personalization_consent_state: string
  /**
   * The ID of the List that users will be synced to.
   */
  external_audience_id?: string
  /**
   * Enable batching for the request.
   */
  enable_batching?: boolean
  /**
   * The number of records to send in each batch.
   */
  batch_size?: number
  /**
   * The name of the current Segment event.
   */
  event_name?: string
}
// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  retlOnMappingSave: {
    inputs?: {
      /**
       * The ID of an existing Google list that you would like to sync users to. If you provide this, we will not create a new list.
       */
      list_id?: string
      /**
       * The name of the Google list that you would like to create.
       */
      list_name?: string
      /**
       * Customer match upload key types.
       */
      external_id_type: string
      /**
       * A string that uniquely identifies a mobile application from which the data was collected. Required if external ID type is mobile advertising ID
       */
      app_id?: string
    }
    outputs?: {
      /**
       * The ID of the Google Customer Match User list that users will be synced to.
       */
      id?: string
      /**
       * The name of the Google Customer Match User list that users will be synced to.
       */
      name?: string
      /**
       * Customer match upload key types.
       */
      external_id_type?: string
    }
  }
}
