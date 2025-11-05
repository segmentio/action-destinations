// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of events you are uploading through TikTok Events API. For non mobile related events use one of the following Integrations: [TikTok Conversions](https://segment.com/docs/connections/destinations/catalog/tiktok-conversions/), [TikTok Offline Conversions](https://segment.com/docs/connections/destinations/catalog/actions-tiktok-offline-conversions) or [TikTok Pixel](https://segment.com/docs/connections/destinations/catalog/actions-tiktok-pixel).
   */
  event_source: string
  /**
   * Your TikTok App ID. Please see TikTok’s [Events API documentation](TODO) for information on how to find this value.
   */
  tiktok_app_id: string
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Timestamp that the event took place, in ISO 8601 format.
   */
  timestamp?: string
  /**
   * A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.
   */
  phone_number?: string[]
  /**
   * A single email address or an array of email addresses. Segment will hash this value before sending to TikTok.
   */
  email?: string[]
  /**
   * Identifier for Advertisers (IDFA for iOS devices and AAID for Android devices). Used for mobile app events tracking.
   */
  advertising_id?: string
  /**
   * Information about the mobile app where the event took place. This field is an allowlist-only feature. If you would like to access it, please contact your TikTok representative.
   */
  app: {
    /**
     * For iOS Apps use the app ID found in the App Store URL. For Android Apps in the Google Play store, use the app ID found in the Google Play store URL. For Android Apps not in the Google Play store, use the package name.
     */
    app_id: string
    /**
     * The name of the mobile app.
     */
    app_name?: string
    /**
     * The version of the mobile app.
     */
    app_version?: string
  }
  /**
   * Information about the ad that led to the app event. This field is an allowlist-only feature. If you would like to access it, please contact your TikTok representative.
   */
  ad?: {
    /**
     * Callback information to help attribute events.
     */
    callback?: string
    /**
     * The TikTok Ad Campaign ID.
     */
    campaign_id?: string
    /**
     * Ad group ID.
     */
    ad_id?: string
    /**
     * Ad ID.
     */
    creative_id?: string
    /**
     * Whether the user is a retargeting user.
     */
    is_retargeting?: boolean
    /**
     * Whether the event is attributed.
     */
    attributed?: boolean
    /**
     * Attribution type.
     */
    attribution_type?: string
    /**
     * Attribution provider.
     */
    attribution_provider?: string
  }
  /**
   * Mobile device details.
   */
  device_details?: {
    /**
     * Used to help determine which device the Mobile Advertising ID is and Mobile Device ID is for.
     */
    device_type?: string
    /**
     * The iOS IDFV. Android Device ID is not supported at this time.
     */
    device_id?: string
    /**
     * The operating system version of the device.
     */
    device_version?: string

    ad_tracking_enabled?: boolean 
  }
  /**
   * Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok. TikTok Conversions Destination supports both string and string[] types for sending external ID(s).
   */
  external_id?: string[]
  /**
   * The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).
   */
  locale?: string
  /**
   * The App Tracking Transparency (ATT) status of the user on iOS devices. This field is required when sending events from iOS 14.5+ devices but should be set to 'Not Applicable' if the iOS version is below 14 or the device is running Android.
   */
  att_status: string
  /**
   * IP address of the device.
   */
  ip?: string
  /**
   * User agent from the user’s device.
   */
  user_agent?: string
  /**
   * Related item details for the event.
   */
  contents?: {
    /**
     * Price of the item.
     */
    price?: number
    /**
     * Number of items.
     */
    quantity?: number
    /**
     * Category of the product item.
     */
    content_category?: string
    /**
     * ID of the product item.
     */
    content_id?: string
    /**
     * Name of the product item.
     */
    content_name?: string
    /**
     * Brand name of the product item.
     */
    brand?: string
  }[]
  /**
   * Product IDs associated with the event, such as SKUs. Do not populate this field if the 'Contents' field is populated. This field accepts a single string value or an array of string values.
   */
  content_ids?: string[]
  /**
   * Number of items when checkout was initiated. Used with the InitiateCheckout event.
   */
  num_items?: number
  /**
   * Type of the product item. When the `content_id` in the `Contents` field is specified as a `sku_id`, set this field to `product`. When the `content_id` in the `Contents` field is specified as an `item_group_id`, set this field to `product_group`.
   */
  content_type?: string
  /**
   * Currency for the value specified as ISO 4217 code.
   */
  currency?: string
  /**
   * Value of the order or items sold.
   */
  value?: number
  /**
   * A string description of the item or page.
   */
  description?: string
  /**
   * Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).
   */
  limited_data_use?: boolean
  /**
   * Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You'll want to remove your Test Event Code when sending real traffic through this integration.
   */
  test_event_code?: string
  /**
   * The text string entered by the user for the search. Optionally used with the Search event.
   */
  search_string?: string
}
