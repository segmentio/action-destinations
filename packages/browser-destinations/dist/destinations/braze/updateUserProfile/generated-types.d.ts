export interface Payload {
  external_id?: string
  country?: string | null
  current_location?: {
    key: string
    latitude: number
    longitude: number
  }
  custom_attributes?: {
    [k: string]: unknown
  }
  dob?: string | number | null
  email?: string | null
  email_subscribe?: string
  first_name?: string | null
  last_name?: string
  gender?: string | null
  home_city?: string | null
  image_url?: string
  language?: string | null
  phone?: string | null
  push_subscribe?: string
}
