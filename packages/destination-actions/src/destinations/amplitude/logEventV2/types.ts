import { ParsedUA } from '../user-agent'

export interface AmplitudeEvent {
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
  use_batch_endpoint?: boolean
  user_agent?: ParsedUA | string
  includeRawUserAgent?: boolean
  userAgentData?: {
    model?: string
    platformVersion?: string
  }
}

export interface UserProperties {
  $set?: { [k: string]: string }
  $setOnce?: { [k: string]: string }
  $unset?: { [k: string]: string }
  $add?: { [k: string]: string }
  [k: string]: unknown
}

export interface JSON {
  api_key: string
  events: AmplitudeEvent[]
  options?: {
    min_id_length: number
  }
}
