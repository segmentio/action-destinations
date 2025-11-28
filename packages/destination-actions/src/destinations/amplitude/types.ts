export type Region = 'north_america' | 'europe'

export interface AmplitudeEventJSON extends EventRevenue {
  user_id?: string | null
  device_id?: string
  event_type: string
  session_id?: number
  time?: number
  event_properties?: Record<string, unknown>
  user_properties?: UserProperties
  groups?: Record<string, unknown>
  app_version?: string
  platform?: string
  device_brand?: string
  carrier?: string
  country?: string
  region?: string
  city?: string
  dma?: string
  language?: string
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
  use_batch_endpoint?: boolean
  user_agent?: ParsedUA | string
  userAgentData?: UserAgentData
}

export interface ParsedUA {
  os_name?: string
  os_version?: string
  device_model?: string
  device_type?: string
  device_manufacturer?: string
}

export interface UserAgentData {
  model?: string
  platformVersion?: string
}

export interface EventRevenue {
  revenue?: number
  price?: number
  productId?: string
  quantity?: number
  revenueType?: string
}

export interface UserProperties {
  $set?: Record<string, string>
  $setOnce?: Record<`initial_${string}`, string>
  $unset?: Record<string, string>
  $add?: Record<string, string>
  [k: string]: unknown
}

export interface JSON_PAYLOAD {
  api_key: string
  events: AmplitudeEventJSON[]
  options?: {
    min_id_length: number
  }
}