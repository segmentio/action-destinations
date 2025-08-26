// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Only valid mobile numbers with an international dialling prefix will be accepted (e.g. 447777123123).
   */
  to: string
  /**
   * Enter a custom From name, or leave blank to use a random number. From name format varies by region. [Learn more](https://support.dotdigital.com/en/articles/8199187-sender-ids-and-originators)
   */
  from?: string
  /**
   * The content of the SMS, up to 160 non-encoded characters per message.
   */
  message: string
  /**
   * [Link shortening](https://developer.dotdigital.com/v2/reference/additional-options#link-shortening) will automatically shorten your links to save character count and track who clicked on them for better reporting. Defaults to No.
   */
  link_shortening?: boolean
  /**
   * If Yes, Unicode characters will be allowed in the message body. If No, any messages containing Unicode will not be sent. Please [read why Unicode](https://developer.dotdigital.com/reference/channel-sms#section-why-is-unicode-important-with-sms) is important before switching this on. Defaults to No.
   */
  allow_unicode?: boolean
}
