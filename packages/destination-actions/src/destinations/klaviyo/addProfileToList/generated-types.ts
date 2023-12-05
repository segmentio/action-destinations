// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's email to send to Klavio.
   */
  email?: string
  /**
   * 'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'
   */
  list_id: string
  /**
   * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID and Email required.
   */
  external_id?: string
}
