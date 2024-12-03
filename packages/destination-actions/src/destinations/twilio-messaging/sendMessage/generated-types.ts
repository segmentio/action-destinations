// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The channel to send the message on.
   */
  channel: string
  /**
   * The number to send the message to (E.164 format).
   */
  toPhoneNumber: string
  /**
   * A valid Facebook Messenger Page Id or Messenger User Id.
   */
  messengerPageUserId?: string
  /**
   * Select Sender Type
   */
  senderType: string
  /**
   * The Twilio phone number (E.164 format). If not in the dropdown, enter it directly. Please ensure the number supports the selected 'Channel' type.
   */
  fromPhoneNumber?: string
  /**
   * The SID of the messaging service to use. If not in the dropdown, enter it directly.
   */
  messagingServiceSid?: string
  /**
   * Select the Twilio Content Template type to use.
   */
  contentTemplateType: string
  /**
   * The SID of the Content Template to use.
   */
  contentSid?: string
  /**
   * The URLs of the media to include with the message. The URLs should be configured in the Content Template in Twilio.
   */
  mediaUrls?: {
    /**
     * The URL of the media to include with the message.
     */
    url: string
  }[]
  /**
   * Variables to be used in the Content Template. The Variables must be defined in the Content Template in Twilio.
   */
  contentVariables?: {
    [k: string]: unknown
  }
  /**
   * Define an inline message body to be sent. Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.
   */
  inlineBody?: string
  /**
   * The URLs of the media to sent with the inline message. The URLs must be publicaly accessible.
   */
  inlineMediaUrls?: string[]
  /**
   * Variables to be send with the inline message. e.g. 'first_name' would match with {{first_name}} in the Inline Template message body.
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
