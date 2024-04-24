// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address to subscribe. If provided, the associated profile will be unsubscribed to Email marketing.
   */
  email?: string
  /**
   * The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be unsubscribed to SMS marketing.
   */
  phone_number?: string
  /**
   * The Klaviyo list to remove the subscribed profiles from. If no list id is provided, the profile will be unsubscribed from all channels.
   */
  list_id?: string
  /**
   * When enabled, the action will use the klaviyo batch API. Field "List Id" will need to be static values when batching is enabled.
   */
  enable_batching?: boolean
}
