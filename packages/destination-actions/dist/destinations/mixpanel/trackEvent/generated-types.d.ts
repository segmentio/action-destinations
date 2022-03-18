export interface Payload {
  event: string
  distinct_id?: string
  group_id?: string
  time?: string | number
  event_properties?: {
    [k: string]: unknown
  }
  user_properties?: {
    [k: string]: unknown
  }
  app_name?: string
  app_namespace?: string
  app_build?: string
  app_version?: string
  os_name?: string
  os_version?: string
  device_id?: string
  device_type?: string
  device_name?: string
  device_manufacturer?: string
  device_model?: string
  bluetooth?: boolean
  carrier?: string
  cellular?: boolean
  wifi?: boolean
  country?: string
  region?: string
  language?: string
  library_name?: string
  library_version?: string
  ip?: string
  idfa?: string
  utm_properties?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
  url?: string
  screen_width?: number
  screen_height?: number
  screen_density?: number
  referrer?: string
  userAgent?: string
}
