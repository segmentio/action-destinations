// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of event
   */
  type: string
  /**
   * The Segment message id
   */
  message_id: string
  /**
   * The timestamp at which the event was created
   */
  timestamp: string | number
  /**
   * When the event was sent
   */
  sent_at: string | number
  /**
   * Segment User Id
   */
  user_id?: string
  /**
   * Segment Anonymous Id
   */
  anonymous_id?: string
  /**
   * The user's email
   */
  email?: string
  /**
   * The contact's first name
   */
  first_name?: string
  /**
   * The contact's last name
   */
  last_name?: string
  /**
   * The contact's full name. It is used if first_name and last_name are not provided.
   */
  name?: string
  /**
   * The contact's job or personal title
   */
  title?: string
  /**
   * The contact's phone number
   */
  phone?: string
  /**
   * The contact's LinkedIn URL
   */
  linked_in?: string
  /**
   * The contact's Twitter (X) URL or handle
   */
  twitter?: string
  /**
   * The contact's Company. It creates a Customer in ChartMogul if the company id is present.
   */
  company?: {
    id?: string
    name?: string
  }
}
