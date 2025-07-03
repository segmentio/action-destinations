// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user performing the action.
   */
  ext_id: string
  /**
   * The name of the user
   */
  name?: string
  /**
   * The phone number of the user
   */
  phone?: string
  /**
   * The email of the user.
   */
  email?: string
  /**
   * The timezone of the user.
   */
  tz?: string
  /**
   * Properties for the user
   */
  props?: {
    [k: string]: unknown
  }
}
