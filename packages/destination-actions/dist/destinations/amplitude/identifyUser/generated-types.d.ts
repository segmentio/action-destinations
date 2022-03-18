export interface Payload {
  user_id?: string | null
  device_id?: string
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
  paying?: boolean
  start_version?: string
  insert_id?: string
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
  library?: string
}
