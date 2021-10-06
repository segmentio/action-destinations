// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Google Ads conversion label. You can find it in your Google Ads account using the instructions in the article [Google Ads conversions](https://support.google.com/tagmanager/answer/6105160?hl=en)
   */
  conversion_label: string
  /**
   * Email address of the customer who triggered the conversion event.
   */
  email: string
  /**
   * Order ID of the conversion event. Google requires an Order ID even if the event is not an ecommerce event.
   */
  transaction_id: string
  /**
   * User Agent of the customer who triggered the conversion event.
   */
  user_agent: string
  /**
   * Timestamp of the conversion event.
   */
  conversion_time: string | number
  /**
   * The monetary value attributed to the conversion event.
   */
  value?: number
  /**
   * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
   */
  currency_code?: string
  /**
   * Phone number of the purchaser, in E.164 standard format, e.g. +14150000000
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
   * Post code of the individual who triggered the conversion event.
   */
  post_code?: string
  /**
   * Country of the individual who triggered the conversion event.
   */
  country?: string
}
