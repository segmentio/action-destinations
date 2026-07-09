import { HTTPError } from '@segment/actions-core'

export class RedditConversionsTestAuthenticationError extends HTTPError {
  response: Response & {
    status: number
    data: {
      message: string
    }
  }
}

export interface Product {
  category?: string
  id?: string
  name?: string
}

export interface EventMetadata {
  currency?: string
  item_count?: number
  value_decimal?: number
  conversion_id?: string
  products?: Array<Product>
}

export interface DatapProcessingOptions {
  country?: string
  modes?: string[]
  region?: string
}

export interface User {
  idfa?: string
  aaid?: string
  email?: string
  external_id?: string
  ip_address?: string
  user_agent?: string
  uuid?: string
  data_processing_options?: DatapProcessingOptions
  screen_dimensions?: {
    height?: number
    width?: number
  }
  phone_number?: string
}

export interface StandardEventPayloadItem {
  event_at: string
  event_type: {
    tracking_type: string
    custom_event_name?: string
  }
  click_id?: string
  event_metadata?: EventMetadata
  user?: User
}

export interface StandardEventPayload {
  events: StandardEventPayloadItem[]
  test_mode?: boolean
  partner: 'SEGMENT'
}

// ---- v3 (feature-flagged) ----

export interface V3Product extends Product {
  quantity?: number
  item_price?: number
}

export interface V3DataProcessingOptions {
  country?: string
  modes?: string[]
  region?: string
}

export interface V3User {
  idfa?: string
  aaid?: string
  email?: string
  external_id?: string
  ip_address?: string
  user_agent?: string
  uuid?: string
  data_processing_options?: V3DataProcessingOptions
  screen_dimensions?: { height?: number; width?: number }
  phone_number?: string
}

export interface V3Metadata {
  currency?: string
  item_count?: number
  value?: number
  conversion_id?: string
  products?: V3Product[]
}

export interface V3EventItem {
  event_at: number
  action_source: string
  event_source_url?: string
  click_id?: string
  type: {
    tracking_type: string
    custom_event_name?: string
  }
  metadata?: V3Metadata
  user?: V3User
}

export interface V3Payload {
  data: {
    events: V3EventItem[]
    partner: 'SEGMENT'
    test_id?: string
  }
}
