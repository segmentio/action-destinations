// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Unique ID or External ID of the profile in Klaviyo. If provided, this will be used to perform the profile lookup. One of email or phone number is still required.
   */
  id?: string
  /**
   * The email address to subscribe. If provided, the associated profile will be subscribed to Email marketing.
   */
  email?: string
  /**
   * The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be subscribed to SMS marketing.
   */
  phone_number?: string
  /**
   * The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.
   */
  list_id?: string
  /**
   * A custom method or source to detail source of consent preferences (e.g., "Marketing Event").
   */
  custom_source?: string
  /**
   * The timestamp of when the profile's consent was gathered.
   */
  consented_at?: string | number
}
