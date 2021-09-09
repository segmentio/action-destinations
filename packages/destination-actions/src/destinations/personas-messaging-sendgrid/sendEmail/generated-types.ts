// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User ID in Segment
   */
  userId: string
  /**
   * Email to send to when testing
   */
  toEmail?: string
  /**
   * From Email
   */
  fromEmail: string
  /**
   * From Name displayed to end user email
   */
  fromName: string
  /**
   * The Email used by user to Reply To
   */
  replyToEmail: string
  /**
   * The Name used by user to Reply To
   */
  replyToName: string
  /**
   * BCC list of emails
   */
  bcc: string
  /**
   * Preview Text
   */
  previewText: string
  /**
   * Subject for the email to be sent
   */
  subject: string
  /**
   * The message body
   */
  body: string
  /**
   * The type of body which is used generally html | design
   */
  bodyType: string
  /**
   * The HTML content of the body
   */
  bodyHtml: string
  /**
   * Journey id used for analytics
   */
  journeyId?: string
  /**
   * Journey state id used for analytics
   */
  journeyStateId?: string
  /**
   * Audience id used for analytics
   */
  audienceId?: string
}
