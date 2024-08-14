// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's first name.
   */
  first_name?: string
  /**
   * The user's last name.
   */
  last_name?: string
  /**
   * The user's email address.
   */
  email?: string
  /**
   * The user's phone number.
   */
  phone?: string
  /**
   * The user's country code.
   */
  country_code?: string
  /**
   * The user's postal code.
   */
  postal_code?: string
  /**
   * Advertiser-assigned user ID for Customer Match upload.
   */
  crm_id?: string
  /**
   * Mobile device ID (advertising ID/IDFA).
   */
  mobile_advertising_id?: string
  /**
   * This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).
   */
  ad_user_data_consent_state: string
  /**
   * This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).
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
  event_name: string
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
