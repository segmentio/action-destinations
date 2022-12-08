// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier.
   */
  customer_id: string
  /**
   * Timestamp of event
   */
  date_email_sent: string | number
  /**
   * name of the campaign associated with the email
   */
  campaign_name?: string
  /**
   * 1=email was clicked, 0 email was not clicked
   */
  clicked_flag?: number
  /**
   * 1=email was opened, 0 email was not opened
   */
  opened_flag?: number
  /**
   * 1=customer unsubscribed from the email list, 0 user remained subscribed
   */
  unsub_flag?: number
  /**
   * Dataset label, should be left as default unless directed otherwise
   */
  stream_key: string
}
