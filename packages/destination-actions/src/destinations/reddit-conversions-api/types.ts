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
  opt_out?: boolean
  user_agent?: string
  uuid?: string
  data_processing_options?: DatapProcessingOptions
  screen_dimensions?: {
    height?: number
    width?: number
  }
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
