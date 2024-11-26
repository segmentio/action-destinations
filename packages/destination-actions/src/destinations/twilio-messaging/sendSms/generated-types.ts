// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The number to send the SMS to. Must be in E.164 format. e.g. +14155552671.
   */
  to: string
  /**
   * Choose the sender of the SMS.
   */
  chooseSender: string
  /**
   * The Twilio Phone Number, Short Code, or Messaging Service to send SMS from.
   */
  from?: string
  /**
   * The SID of the messaging service to use.
   */
  messagingServiceSid?: string
  /**
   * Choose the type of template to use. Inline allows for the message to be defined in the Body field. Pre-defined template uses a template that is already defined in Twilio.
   */
  chooseTemplateType: string
  /**
   * The SID of the pre-defined template to use. The tempalte must already exist in Twilio. Variables can be referenced with {{variable}}.
   */
  templateSid?: string
  /**
   * Variables to be used in the template.
   */
  contentVariables?: {
    [k: string]: unknown
  }
  /**
   * The message to send. Template Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.
   */
  body: string
  /**
   * Variables to be used in the template.
   */
  inlineVariables?: {
    [k: string]: unknown
  }
  /**
   * The URL of the media to include with the message. Must be a valid media URL. Accepts a single URL or an array of URLs.
   */
  media_url?: string[]
  /**
   * The number of seconds between 1-36000 that the message is valid for. Default is 36000. If the message is not delivered within this time, it will not be delivered.
   */
  validity_period?: number
  /**
   * The time that Twilio will send the message. Must be in ISO 8601 format.
   */
  send_at?: string
}
