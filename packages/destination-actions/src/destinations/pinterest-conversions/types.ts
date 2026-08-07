import { HTTPError } from '@segment/actions-core'

export class PinterestConversionsTestAuthenticationError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}

// --- Pinterest Conversions API Event Types ---

export interface UserData {
  em?: string[]
  ph?: string[]
  ge?: string[]
  db?: string[]
  ln?: string[]
  fn?: string[]
  ct?: string[]
  st?: string[]
  zp?: string[]
  country?: string[]
  external_id?: string[]
  client_ip_address?: string
  client_user_agent?: string
  hashed_maids?: string[]
  click_id?: string | null
  partner_id?: string | null
}

export interface ContentsItem {
  id?: string
  // Converted from number to string before sending
  item_price?: string
  quantity?: number
  item_brand?: string
  item_brand_id?: string
  item_category?: string
  item_name?: string
}

export interface CustomData {
  currency?: string
  // Converted from number to string before sending
  value?: string
  content_ids?: string[]
  contents?: ContentsItem[]
  num_items?: number
  order_id?: string
  search_string?: string
  opt_out_type?: string
  content_brand?: string
  content_category?: string
  content_name?: string
  // Converted from number to string before sending
  predicted_ltv?: string
  np?: string
}

export interface AppInfo {
  app_id?: string
  app_name?: string
  app_package_name?: string
  app_store?: string
  app_version?: string
  install_time?: number
  user_agent?: string
  window_height?: number
  window_width?: number
}

export interface DeviceInfo {
  battery_level?: number
  brand?: string
  carrier?: string
  cpu_cores?: number
  external_storage_free_space?: number
  external_storage_size?: number
  form_factor?: string
  kernel_version?: string
  languages?: string[]
  locale?: string
  model?: string
  network_type?: string
  os_family?: string
  os_name?: string
  os_release_name?: string
  os_version?: string
  screen_density?: number
  screen_height?: number
  screen_width?: number
  storage_free_space?: number
  storage_size?: number
  timezone?: string
  timezone_abbr?: string
  type?: string
}

export interface PinterestEventPayload {
  event_name: string
  action_source: string
  event_time: number
  event_id: string
  event_source_url?: string
  partner_name: string
  opt_out?: boolean
  advertiser_tracking_enabled?: boolean
  user_data: UserData
  custom_data: CustomData
  app_info?: AppInfo
  device_info?: DeviceInfo
  wifi?: boolean
  language?: string
}

export interface LegacyPinterestEventPayload {
  event_name: string
  action_source: string
  event_time: number
  event_id: string
  event_source_url?: string
  partner_name: string
  opt_out?: boolean
  advertiser_tracking_enabled?: boolean
  user_data: UserData
  custom_data: CustomData
  app_id?: string
  app_name?: string
  app_version?: string
  device_brand?: string
  device_carrier?: string
  device_model?: string
  device_type?: string
  os_version?: string
  wifi?: boolean
  language?: string
}
