// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Individual's email address. One of External ID, Phone Number and Email required.
   */
  email?: string
  /**
   * When enabled, the action will use the klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.
   */
  phone_number?: string
  /**
   * Country Code in ISO 3166-1 alpha-2 format. If provided, this will be used to validate and automatically format Phone Number field in E.164 format accepted by Klaviyo.
   */
  country_code?: string
  /**
   * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID, Phone Number and Email required.
   */
  external_id?: string
  /**
   * Individual's first name.
   */
  first_name?: string
  /**
   * Individual's last name.
   */
  last_name?: string
  /**
   * Name of the company or organization within the company for whom the individual works.
   */
  organization?: string
  /**
   * Individual's job title.
   */
  title?: string
  /**
   * URL pointing to the location of a profile image.
   */
  image?: string
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
   * The Klaviyo list to add the profile to.
   */
  list_id?: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * Klaviyo list ID to override the default list ID when provided in an event payload. Added to support backward compatibility with klaviyo(classic) and facilitate a seamless migration.
   */
  override_list_id?: string
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * The ID of the list in Klaviyo that users will be synced to. If defined, we will not create a new list.
   */
  list_identifier?: string
  /**
   * The name of the list that you would like to create in Klaviyo.
   */
  list_name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The ID of the created Klaviyo list that users will be synced to.
   */
  id?: string
  /**
   * The name of the created Klaviyo list that users will be synced to.
   */
  name?: string
}
