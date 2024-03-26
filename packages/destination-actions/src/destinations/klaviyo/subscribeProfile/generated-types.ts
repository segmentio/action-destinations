// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Id of the profile to subscribe. If provided, this will be used to perform the profile lookup.
   */
  klaviyo_id?: string
  /**
   * Individual's email address. One of ID, Phone Number or Email required.
   */
  email?: string
  /**
   * Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.
   */
  phone_number?: string
  /**
   * When enabled, the action will use the klaviyo batch API.
   */
  enable_batching?: boolean
  /**
   * The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.
   */
  list_id?: string
}
