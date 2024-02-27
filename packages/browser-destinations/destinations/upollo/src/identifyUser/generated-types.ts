// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user
   */
  user_id?: string
  /**
   * The user's name.
   */
  name?: string
  /**
   * The user's given name.
   */
  firstName?: string
  /**
   * The user's surname.
   */
  lastName?: string
  /**
   * The user's email address.
   */
  email?: string
  /**
   * The user's phone number.
   */
  phone?: string
  /**
   * The URL for the user's avatar/profile image.
   */
  avatar_image_url?: string
  /**
   * The user's custom attributes.
   */
  custom_traits?: {
    [k: string]: unknown
  }
}
