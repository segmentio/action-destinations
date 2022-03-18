export interface Payload {
  event: string
  event_id?: string
  timestamp?: string
  phone_number?: string
  email?: string
  external_id?: string
  ttclid?: string
  url?: string
  referrer?: string
  ip?: string
  user_agent?: string
  contents?: {
    price?: number
    quantity?: number
    content_type?: string
    content_id?: string
  }[]
  currency?: string
  value?: number
  description?: string
  query?: string
  test_event_code?: string
}
