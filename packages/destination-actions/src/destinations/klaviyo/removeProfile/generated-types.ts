// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Individual's email address. One of External ID, or Email required.
   */
  email?: string
  /**
   * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID, Phone Number and Email required.
   */
  external_id?: string
  /**
   * The Klaviyo list to add the profile to.
   */
  list_id: string
  /**
   * When enabled, the action will use the klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.
   */
  phone_number?: string
  /**
   * Country Code in ISO 3166-1 alpha-2 format. If provided, this will be used to validate and automatically format Phone Number field in E.164 format accepted by Klaviyo.
   */
  country_code?: string
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
