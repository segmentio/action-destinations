export interface TikTokConversionsRequest {
  event_source: string
  event_source_id: string
  partner_name: string
  test_event_code?: string
  data: TikTokConversionsData[]
}

export interface TikTokConversionsData {
  event: string
  event_time: number
  event_id?: string
  user: TikTokConversionsUser
  properties: TikTokConversionsProperties
  page?: TikTokConversionsPage
  limited_data_use: boolean
}

export interface TikTokConversionsPage {
  url?: string
  referrer?: string
}

export interface TikTokConversionsUser {
  external_id: string[]
  phone: string[]
  email: string[]
  ttp?: string
  lead_id?: string
  ip?: string
  user_agent?: string
  locale?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  country?: string
  zip_code?: string
  ttclid?: string
}

export interface TikTokConversionsProperties {
  contents: TikTokConversionsContent[]
  content_type?: string
  currency?: string
  value?: number
  query?: string
  description?: string
  order_id?: string
  shop_id?: string
}

export interface TikTokConversionsContent {
  price?: number
  quantity?: number
  content_category?: string
  content_id?: string
  content_name?: string
  brand?: string
}
