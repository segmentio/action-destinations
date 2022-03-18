export interface Payload {
  conversion_label: string
  email: string
  transaction_id: string
  user_agent?: string
  conversion_time: string | number
  value?: number
  currency_code?: string
  is_app_incrementality?: boolean
  phone_number?: string
  first_name?: string
  last_name?: string
  street_address?: string
  city?: string
  region?: string
  post_code?: string
  country?: string
}
