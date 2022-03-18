export interface Payload {
  external_id?: string
  user_alias?: {
    alias_name?: string
    alias_label?: string
  }
  braze_id?: string | null
  country?: string | null
  current_location?: {
    latitude?: number
    longitude?: number
  }
  date_of_first_session?: string | number | null
  date_of_last_session?: string | number | null
  dob?: string | number | null
  email?: string | null
  email_subscribe?: string
  email_open_tracking_disabled?: boolean
  email_click_tracking_disabled?: boolean
  facebook?: {
    id?: string
    likes?: string[]
    num_friends?: number
  }
  first_name?: string | null
  gender?: string | null
  home_city?: string | null
  image_url?: string | null
  language?: string | null
  last_name?: string
  marked_email_as_spam_at?: string | number | null
  phone?: string | null
  push_subscribe?: string
  push_tokens?: {
    app_id: string
    token: string
    device_id?: string
  }[]
  time_zone?: string
  twitter?: {
    id?: string
    screen_name?: string
    followers_count?: number
    friends_count?: number
    statuses_count?: number
  }
  custom_attributes?: {
    [k: string]: unknown
  }
  _update_existing_only?: boolean
}
