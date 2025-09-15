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
  user_id: string
  /**
   * Segment Group Id
   */
  group_id: string
  /**
   * The company's name
   */
  name?: string
  /**
   * The company's name
   */
  description?: string
  /**
   * The company's email
   */
  email?: string
  /**
   * The company's website URL
   */
  website?: string
  /**
   * Date the group’s account was first created
   */
  created_at?: string | number
  /**
   * The company’s address details
   */
  address?: {
    /**
     * The company’s street address
     */
    street?: string
    /**
     * The company’s city
     */
    city?: string
    /**
     * The company’s state or region
     */
    state?: string
    /**
     * The company’s zip or postal code
     */
    postal_code?: string
    /**
     * The company’s country
     */
    country?: string
  }
}
