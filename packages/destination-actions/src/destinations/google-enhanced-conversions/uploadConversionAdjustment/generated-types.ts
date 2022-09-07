// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the conversion action associated with this conversion. To find the Conversion Action ID, click on your conversion in Google Ads and get the value for ctId in the URL. For example, if the URL is https://ads.google.com/aw/conversions/detail?ocid=00000000&ctId=576882000, your Conversion Action ID is 576882000.
   */
  conversion_action: string
  /**
   * The adjustment type. See Google’s documentation for details on each type.
   */
  adjustment_type: string
  /**
   * The date time at which the adjustment occurred. Must be after the conversion_date_time. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00".
   */
  adjustment_timestamp: string
  /**
   * The order ID of the conversion to be adjusted. If the conversion was reported with an order ID specified, that order ID must be used as the identifier here. Required for ENHANCEMENT adjustments.
   */
  order_id?: string
  /**
   * Google click ID associated with the original conversion for this adjustment. This is used for the GCLID Date Time Pair. Required for non-ENHANCEMENT adjustments. If adjustment is ENHANCEMENT, this value is optional but may be set in addition to the order ID.
   */
  gclid?: string
  /**
   * The date time at which the original conversion for this adjustment occurred. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00". This is used for the GCLID Date Time Pair. Required for non-ENHANCEMENT adjustments. If adjustment is ENHANCEMENT, this value is optional but may be set in addition to the order ID.
   */
  conversion_timestamp?: string
  /**
   * The restated conversion value. This is the value of the conversion after restatement. For example, to change the value of a conversion from 100 to 70, an adjusted value of 70 should be reported. Required for RESTATEMENT adjustments.
   */
  restatement_value?: number & string
  /**
   * The currency of the restated value. If not provided, then the default currency from the conversion action is used, and if that is not set then the account currency is used. This is the ISO 4217 3-character currency code e.g. USD or EUR.
   */
  restatement_currency_code?: string
  /**
   * Email address of the individual who triggered the conversion event. Segment will hash this value before sending to Google.
   */
  email_address?: string
  /**
   * Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000. Segment will hash this value before sending to Google.
   */
  phone_number?: string
  /**
   * First name of the user who performed the conversion. Segment will hash this value before sending to Google.
   */
  first_name?: string
  /**
   * Last name of the user who performed the conversion. Segment will hash this value before sending to Google.
   */
  last_name?: string
  /**
   * City of the user who performed the conversion.
   */
  city?: string
  /**
   * State of the user who performed the conversion.
   */
  state?: string
  /**
   * 2-letter country code in ISO-3166-1 alpha-2 of the user who performed the conversion.
   */
  country?: string
  /**
   * Postal code of the user who performed the conversion.
   */
  postal_code?: string
  /**
   * Street address of the user who performed the conversion. Segment will hash this value before sending to Google.
   */
  street_address?: string
  /**
   * The user agent to enhance the original conversion. User agent can only be specified in enhancements with user identifiers. This should match the user agent of the request that sent the original conversion so the conversion and its enhancement are either both attributed as same-device or both attributed as cross-device.
   */
  user_agent?: string
}
