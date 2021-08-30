// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * value
   */
  value: number
  /**
   * currency
   */
  currency: string
  /**
   * Name of the page/product.
   */
  content_name?: string
  /**
   * content type
   */
  content_type?: string
  /**
   * An array of JSON objects
   */
  contents?: {
    [k: string]: unknown
  }
  /**
   * Number of Items
   */
  num_items?: number
  /**
   * Product IDs associated with the event, such as SKUs (e.g. ["ABC123", "XYZ789"]).
   */
  content_ids?: {
    [k: string]: unknown
  }
  /**
   * The action source of the event
   */
  action_source?: string
  /**
   * User Data
   */
  user_data?: {
    /**
     * User Email
     */
    email?: string
    /**
     * User phone number
     */
    phone?: string
    /**
     * User gender
     */
    gender?: string
    /**
     * Client User Agent
     */
    client_user_agent?: string
  }
}
