export interface Payload {
  trackRevenuePerProduct?: boolean
  user_id?: string | null
  device_id?: string
  event_type: string
  session_id?: string | number
  time?: string | number
  event_properties?: {
    [k: string]: unknown
  }
  user_properties?: {
    [k: string]: unknown
  }
  groups?: {
    [k: string]: unknown
  }
  app_version?: string
  platform?: string
  os_name?: string
  os_version?: string
  device_brand?: string
  device_manufacturer?: string
  device_model?: string
  carrier?: string
  country?: string
  region?: string
  city?: string
  dma?: string
  language?: string
  price?: number
  quantity?: number
  revenue?: number
  productId?: string
  revenueType?: string
  location_lat?: number
  location_lng?: number
  ip?: string
  idfa?: string
  idfv?: string
  adid?: string
  android_id?: string
  event_id?: number
  insert_id?: string
  library?: string
  products?: {
    price?: number
    quantity?: number
    revenue?: number
    productId?: string
    revenueType?: string
  }[]
  use_batch_endpoint?: boolean
  userAgent?: string
  userAgentParsing?: boolean
  utm_properties?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
  referrer?: string
  min_id_length?: number | null
}
