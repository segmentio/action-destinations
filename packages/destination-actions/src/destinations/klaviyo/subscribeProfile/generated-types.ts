// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address to subscribe. If provided, the associated profile will be subscribed to Email marketing.
   */
  email?: string
  /**
   * The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be subscribed to SMS marketing.
   */
  phone_number?: string
  /**
   * Country Code in ISO 3166-1 alpha-2 format. If provided, this will be used to validate and automatically format Phone Number field in E.164 format accepted by Klaviyo.
   */
  country_code?: string
  /**
   * The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.
   */
  list_id?: string
  /**
   * A custom method or source to detail source of consent preferences (e.g., "Marketing Event"). The default is set to -59, as this is [the $source value associated with Segment](https://help.klaviyo.com/hc/en-us/articles/1260804673530#h_01HDKHG9AM4BSSM009BM6XBF1H).
   */
  custom_source?: string
  /**
   * The timestamp of when the profile's consent was gathered.
   */
  consented_at?: string | number
  /**
   * When enabled, the action will use the Klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
