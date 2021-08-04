// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  external_id?: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias?: {
    alias_name: string
    alias_label: string
  }
  /**
   * The unique user identifier
   */
  braze_id?: string | null
  /**
   * The country code of the user
   */
  country?: string | null
  /**
   * The user's current longitude/latitude.
   */
  current_location?: {
    latitude?: number
    longitude?: number
  }
  /**
   * The date the user first used the app
   */
  date_of_first_session?: string | number | null
  /**
   * The date the user last used the app
   */
  date_of_last_session?: string | number | null
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
   * Set to true to disable the open tracking pixel from being added to all future emails sent to this user.
   */
  email_open_tracking_disabled?: boolean
  /**
   * Set to true to disable the click tracking for all links within a future email, sent to this user.
   */
  email_click_tracking_disabled?: boolean
  /**
   * Hash of Facebook attribution containing any of `id` (string), `likes` (array of strings), `num_friends` (integer).
   */
  facebook?: {
    id?: string
    likes?: string[]
    num_friends?: number
  }
  /**
   * The user's first name
   */
  first_name?: string | null
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
  image_url?: string | null
  /**
   * The user's preferred language.
   */
  language?: string | null
  /**
   * The user's last name
   */
  last_name?: string
  /**
   * The date the user marked their email as spam.
   */
  marked_email_as_spam_at?: string | number | null
  /**
   * The user's phone number
   */
  phone?: string | null
  /**
   * The user's push subscription preference: “opted_in” (explicitly registered to receive push messages), “unsubscribed” (explicitly opted out of push messages), and “subscribed” (neither opted in nor out).
   */
  push_subscribe?: string
  /**
   * Array of objects with app_id and token string. You may optionally provide a device_id for the device this token is associated with, e.g., [{"app_id": App Identifier, "token": "abcd", "device_id": "optional_field_value"}]. If a device_id is not provided, one will be randomly generated.
   */
  push_tokens?: {
    /**
     * The app identifier for the push token.
     */
    app_id: string
    /**
     * The push token.
     */
    token: string
    /**
     * Identifier for the device associated with this token
     */
    device_id?: string
  }[]
  /**
   * The user’s time zone name from IANA Time Zone Database  (e.g., “America/New_York” or “Eastern Time (US & Canada)”). Only valid time zone values will be set.
   */
  time_zone?: string
  /**
   * Hash containing any of id (integer), screen_name (string, Twitter handle), followers_count (integer), friends_count (integer), statuses_count (integer).
   */
  twitter?: {
    id?: string
    screen_name?: string
    followers_count?: number
    friends_count?: number
    statuses_count?: number
  }
  /**
   * Hash of custom attributes to send to Braze
   */
  custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * Setting this flag to true will put the API in "Update Only" mode. When using a "user_alias", "Update Only" mode is always true.
   */
  _update_existing_only?: boolean
}
