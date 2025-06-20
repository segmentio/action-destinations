// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The channel to send the message on.
   */
  channel: string
  /**
   * The Sender type to use for the message. Depending on the selected 'Channel' this can be a phone number, messaging service, or Messenger sender ID.
   */
  senderType: string
  /**
   * The Content Template type to use for the message. Selecting "Inline" will allow you to define the message body directly. For all other options a Content Template must be pre-defined in Twilio.
   */
  contentTemplateType: string
  /**
   * The number to send the message to (E.164 format).
   */
  toPhoneNumber?: string
  /**
   * A valid Facebook Messenger Page Id or Messenger User Id to send the message to.
   */
  toMessengerPageUserId?: string
  /**
   * The Twilio phone number (E.164 format) or Short Code. If not in the dropdown, enter it directly. Please ensure the number supports the selected 'Channel' type.
   */
  fromPhoneNumber?: string
  /**
   * The unique identifier for your Facebook Page, used to send messages via Messenger. You can find this in your Facebook Page settings.
   */
  fromMessengerSenderId?: string
  /**
   * The SID of the messaging service to use. If not in the dropdown, enter it directly.
   */
  messagingServiceSid?: string
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
   * The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.
   */
  validityPeriod?: number
  /**
   * The time that Twilio will send the message. Must be in ISO 8601 format.
   */
  sendAt?: string
}
