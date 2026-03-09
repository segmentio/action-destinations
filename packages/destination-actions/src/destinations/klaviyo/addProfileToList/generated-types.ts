// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's email to send to Klavio.
   */
  email?: string
  /**
   * Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.
   */
  phone_number?: string
  /**
   * 'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'
   */
  list_id: string
  /**
   * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID and Email required.
   */
  external_id?: string
  /**
   * When enabled, the action will use the klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * Individual's first name.
   */
  first_name?: string
  /**
   * Individual's last name.
   */
  last_name?: string
  /**
   * URL pointing to the location of a profile image.
   */
  image?: string
  /**
   * Individual's job title.
   */
  title?: string
  /**
   * Name of the company or organization within the company for whom the individual works.
   */
  organization?: string
  /**
   * Individual's address.
   */
  location?: {
    address1?: string | null
    address2?: string | null
    city?: string | null
    region?: string | null
    zip?: string | null
    latitude?: string | null
    longitude?: string | null
    country?: string | null
  }
  /**
   * An object containing key/value pairs for any custom properties assigned to this profile.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Country Code in ISO 3166-1 alpha-2 format. If provided, this will be used to validate and automatically format Phone Number field in E.164 format accepted by Klaviyo.
   */
  country_code?: string
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
