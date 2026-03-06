// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's email to send to Klavio.
   */
  email?: string
  /**
   * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID and Email required.
   */
  external_id?: string
  /**
   * 'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'
   */
  list_id: string
  /**
   * Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.
   */
  phone_number?: string
  /**
   * When enabled, the action will use the klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * Country Code in ISO 3166-1 alpha-2 format. If provided, this will be used to validate and automatically format Phone Number field in E.164 format accepted by Klaviyo.
   */
  country_code?: string
  /**
   * Maximum number of profiles to include in each batch sent to Klaviyo. Lower values reduce payload size but increase API requests. Recommended: 500-1000 for RETL sources, 5000-10000 for event streams. Klaviyo API maximum: 10,000 profiles.
   */
  batch_size?: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
