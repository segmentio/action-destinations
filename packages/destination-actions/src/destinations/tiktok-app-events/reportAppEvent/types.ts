import { APP_STATUS } from './constants'

export interface TTJSON {
  event_source: string
  event_source_id: string
  partner_name: string
  test_event_code?: string
  data: TTDataItem[]
}

interface TTDataItem {
  event: string
  event_time: number
  event_id?: string
  user: TTUser
  properties: TTBaseProps
  limited_data_use: boolean
  app: TTApp
  ad: TTAd
}

export interface TTUser {
  external_id: string[]
  phone: string[]
  email: string[]
  idfa?: string
  idfv?: string
  ip?: string
  user_agent?: string
  locale?: string
  att_status?: AppStatus
}

export type AppStatus = typeof APP_STATUS[keyof typeof APP_STATUS]

export interface TTApp {
  app_id?: string,
  app_name?: string,
  app_version?: string
}

export interface TTAd {
  callback?: string
  campaign_id?: string
  ad_id?: string
  creative_id?: string
  is_retargeting?: boolean
  attributed?: boolean
  attribution_type?: string
  attribution_provider?: string 
}

export interface TTBaseProps {
  contents: TTContentItem[]
  content_type?: string
  currency?: string
  value?: number
  description?: string
  content_ids?: string[]
  num_items?: number
  search_string?: string
}

interface TTContentItem {
  price?: number
  quantity?: number
  content_category?: string
  content_id?: string
  content_name?: string
  brand?: string
}