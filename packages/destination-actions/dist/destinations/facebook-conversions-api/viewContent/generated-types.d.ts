export interface Payload {
  action_source: string
  event_time: string
  user_data: {
    externalId?: string
    email?: string
    phone?: string
    gender?: string
    dateOfBirth?: string
    lastName?: string
    firstName?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string
    fbp?: string
    subscriptionID?: string
    leadID?: number
    fbLoginID?: number
  }
  content_category?: string
  content_ids?: string[]
  content_name?: string
  content_type?: string
  contents?: {
    id?: string
    quantity?: number
    item_price?: number
    delivery_category?: string
  }[]
  currency?: string
  event_id?: string
  event_source_url?: string
  value?: number
  custom_data?: {
    [k: string]: unknown
  }
}
