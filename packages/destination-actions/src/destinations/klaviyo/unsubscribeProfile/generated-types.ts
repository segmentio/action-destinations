// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address to unsubscribe. If provided, the associated profile will be unsubscribed to Email marketing.
   */
  email?: string
  /**
   * The phone number to unsubscribe. This must be in E.164 format. If provided, the associated profile will be unsubscribed to SMS marketing.
   */
  phone_number?: string
  /**
   * Country Code in ISO 3166-1 alpha-2 format. If provided, this will be used to validate and automatically format Phone Number field in E.164 format accepted by Klaviyo.
   */
  country_code?: string
  /**
   * The Klaviyo list to remove the subscribed profiles from. If no list id is provided, the profile will be unsubscribed from all channels.
   */
  list_id?: string
  /**
   * When enabled, the action will use the Klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
