// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Offline Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event: string
  /**
   * A unique value for each event. This ID can be used to match data between partner and TikTok. We suggest it is a String of 32 characters, including numeric digits (0-9), uppercase letters (A-Z), and lowercase letters (a-z).
   */
  event_id?: string
  /**
   * Timestamp that the event took place, in ISO 8601 format.
   */
  timestamp: string
  /**
   * A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. At least one phone number is required if no value is provided in the Emails field.
   */
  phone_numbers?: string[]
  /**
   * A single email address or an array of email addresses. Segment will hash this value before sending to TikTok. At least one email is required if no value is provided in the Phone Numbers field.
   */
  email_addresses?: string[]
  /**
   * A string description of the web event.
   */
  order_id?: string
  /**
   * The text string that was searched for.
   */
  shop_id?: string
  /**
   * Event channel of the offline conversion event. Accepted values are: email, website, phone_call, in_store, crm, other
   */
  event_channel?: string
}
