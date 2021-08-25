// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  external_id?: string
  /**
   * The country code of the user
   */
  country?: string | null
  /**
   * The user's current longitude/latitude.
   */
  current_location?: {
    key: string
    latitude: number
    longitude: number
  }
  /**
   * Sets a custom user attribute. This can be any key/value pair and is used to collect extra information about the user.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * The user's date of birth
   */
  dob?: string | number | null
  /**
   * The user's email
   */
  email?: string | null
  /**
   * The user's email subscription preference: “opted_in” (explicitly registered to receive email messages), “unsubscribed” (explicitly opted out of email messages), and “subscribed” (neither opted in nor out).
   */
  email_subscribe?: string
  /**
   * The user's first name
   */
  first_name?: string | null
  /**
   * The user's last name
   */
  last_name?: string
  /**
   * The user's gender: “M”, “F”, “O” (other), “N” (not applicable), “P” (prefer not to say) or nil (unknown).
   */
  gender?: string | null
  /**
   * The user's home city.
   */
  home_city?: string | null
  /**
   * URL of image to be associated with user profile.
   */
  image_url?: string
  /**
   * The user's preferred language.
   */
  language?: string | null
  /**
   * The user's phone number
   */
  phone?: string | null
  /**
   * The user's push subscription preference: “opted_in” (explicitly registered to receive push messages), “unsubscribed” (explicitly opted out of push messages), and “subscribed” (neither opted in nor out).
   */
  push_subscribe?: string
}
