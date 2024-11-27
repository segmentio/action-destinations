// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The number to send the SMS to (E.164 format).
   */
  toPhoneNumber: string
  /**
   * Select Sender Type
   */
  senderType: string
  /**
   * The Twilio phone number (E.164 format) or short code for sending SMS/MMS. If not in the dropdown, enter it directly and ensure the number supports SMS/MMS.
   */
  fromPhoneNumber?: string
  /**
   * The SID of the messaging service to use. If not in the dropdown, enter it directly.
   */
  messagingServiceSid?: string
  /**
   * Inicate if a pre-defined Content Template should be used, or if the message body should be specified inline.
   */
  templateType: string
  /**
   * The SID of the pre-defined Twilio SMS or MMS template to use.
   */
  templateSid?: string
  /**
   * The URLs of the media to include with the message. The URLs should be configured in the Content Template.
   */
  mediaUrls?: {
    /**
     * The URL of the media to include with the message.
     */
    url: string
  }[]
  /**
   * Variables to be used in the template.
   */
  contentVariables?: {
    [k: string]: unknown
  }
  /**
   * The message to send. Template Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.
   */
  inlineBody?: string
  /**
   * The URLs of the media to include with the message. The URLs should be publicly accessible. Accepts a single URL or array of URLs.
   */
  inlineMediaUrls?: string[]
  /**
   * Variables to be used in the template.
   */
  inlineVariables?: {
    [k: string]: unknown
  }
  /**
   * The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.
   */
  validityPeriod?: number
  /**
   * The time that Twilio will send the message. Must be in ISO 8601 format.
   */
  sendAt?: string
}
