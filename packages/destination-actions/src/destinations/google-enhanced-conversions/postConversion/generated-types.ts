// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Google Ads conversion label. You can find it in your Google Ads account using the instructions in the article [Google Ads conversions](https://support.google.com/tagmanager/answer/6105160?hl=en).
   */
  conversion_label: string
  /**
   * Email address of the individual who triggered the conversion event.
   */
  email: string
  /**
   * Order ID or Transaction ID of the conversion event. Google requires an Order ID even if the event is not an ecommerce event. Learn more in the article [Use a transaction ID to minimize duplicate conversions](https://support.google.com/google-ads/answer/6386790?hl=en&ref_topic=3165803).
   */
  transaction_id: string
  /**
   * User agent of the individual who triggered the conversion event. This should match the user agent of the request that sent the original conversion so the conversion and its enhancement are either both attributed as same-device or both attributed as cross-device. This field is optional but recommended.
   */
  user_agent?: string
  /**
   * Timestamp of the conversion event.
   */
  conversion_time: string | number
  /**
   * The monetary value attributed to the conversion event.
   */
  value?: number
  /**
   * Currency of the purchase or items associated with the conversion event, in 3-letter ISO 4217 format.
   */
  currency_code?: string
  /**
   * Set to true if this is an app conversion for an incrementality study.
   */
  is_app_incrementality?: boolean
  /**
   * Alpha feature offered by Google for gaming industry. When set to true, Segment will send pcc_game = 1 to Google.
   */
  pcc_game?: boolean
  /**
   * Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000.
   */
  phone_number?: string
  /**
   * First name of the individual who triggered the conversion event.
   */
  first_name?: string
  /**
   * Last name of the individual who triggered the conversion event.
   */
  last_name?: string
  /**
   * Street address of the individual who triggered the conversion event.
   */
  street_address?: string
  /**
   * City of the individual who triggered the conversion event.
   */
  city?: string
  /**
   * Region of the individual who triggered the conversion event.
   */
  region?: string
  /**
   * Postal code of the individual who triggered the conversion event.
   */
  post_code?: string
  /**
   * Country of the individual who triggered the conversion event.
   */
  country?: string
}
