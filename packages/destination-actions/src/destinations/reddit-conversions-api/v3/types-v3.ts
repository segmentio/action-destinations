import { ACTION_SOURCE_V3_LABELS, TRACKING_TYPE_V3 } from './constants'

export type ActionSourceV3 = keyof typeof ACTION_SOURCE_V3_LABELS
export type EventTypeV3 = typeof TRACKING_TYPE_V3[keyof typeof TRACKING_TYPE_V3]

export interface ProductV3 {
  category?: string
  id: string
  name?: string
  quantity?: number
  item_price?: number
}

export interface MetadataV3 {
  currency?: string // if passed, must also include value. Only acceptable for some event types. Cannot be passed for Page Visit, View Content, Search
  item_count?: number // only accepted for Add to Cart, Add to Wishlist, Custom, Purchase events. Recommended for Purchase, not required.
  value?: number // if passed, must also include currency. Only acceptable for some event types. Cannot be passed for Page Visit, View Content, Search
  conversion_id: string // required for all events.
  products?: Array<ProductV3> // accepted for all events, never required. Products need an id for Product Ads / DPA matching.
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
  event_source_url?: string // can only be passed when action_source is 'WEBSITE'
  click_id?: string // required if no user object provided
  type: {
    tracking_type: EventTypeV3
    custom_event_name?: string // required if tracking_type is CUSTOM
  }
  metadata: MetadataV3
  user?: UserV3 // required if no click_id provided, and must carry at least one match key - data_processing_options and screen_dimensions do not count
}

export interface PayloadV3 {
  data: {
    events: EventItemV3[]
    partner: 'SEGMENT'
    test_id?: string
  }
}
