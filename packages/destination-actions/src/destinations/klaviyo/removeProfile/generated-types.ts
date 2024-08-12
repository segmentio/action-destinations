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
}
