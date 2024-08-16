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
}
