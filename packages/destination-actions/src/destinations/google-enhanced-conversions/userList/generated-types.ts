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
   * Should Segment hash the user’s data before sending it to Google? Set this to false if you are already sending hashed data.
   */
  hash_data?: boolean
  /**
   * Advertiser-assigned user ID for Customer Match upload.
   */
  crm_id?: string
  /**
   * Mobile device ID (advertising ID/IDFA).
   */
  mobile_advertising_id?: string
  /**
   * A string that uniquely identifies a mobile application from which the data was collected.
   */
  app_id?: string
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
   * The name of the current Segment event.
   */
  event_name: string
}
