import { ACTION_SOURCE_V3, EVENT_TYPE_V3 } from './constants'

export type ActionSourceV3 = typeof ACTION_SOURCE_V3[number]
export type EventTypeV3 = typeof EVENT_TYPE_V3[number]

export interface ProductV3 {
  category?: string
  id: string
  name?: string
  quantity?: number
  item_price?: number
}

export interface MetadataV3 {
  currency?: string
  item_count?: number
  value?: number
  conversion_id?: string
  products?: Array<ProductV3>
}

export interface DataProcessingOptionsV3 {
  country?: string
  modes?: string[]
  region?: string
}

export interface UserV3 {
  idfa?: string
  aaid?: string
  email?: string
  external_id?: string
  ip_address?: string
  user_agent?: string
  uuid?: string
  data_processing_options?: DataProcessingOptionsV3
  screen_dimensions?: {
    height?: number
    width?: number
  }
  phone_number?: string
}

export interface EventItemV3 {
  event_at: number // milliseconds
  action_source: ActionSourceV3
  event_source_url?: string
  click_id?: string
  type: {
    tracking_type: EventTypeV3
    custom_event_name?: string // required if tracking_type is CUSTOM
  }
  event_metadata?: MetadataV3
  user?: UserV3
}

export interface PayloadV3 {
  data: {
    events: EventItemV3[]
    partner: 'SEGMENT'
    test_id?: string
  }
}
