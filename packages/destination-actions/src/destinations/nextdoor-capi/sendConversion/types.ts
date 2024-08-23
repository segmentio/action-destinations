export interface NDPayload {
  event_name: string
  event_id?: string
  event_time: string
  action_source: string
  client_id: string
  action_source_url?: string
  delivery_optimization: boolean
  event_timezone?: string

  customer: {
    [k: string]: string | undefined
  }

  custom: Custom
  app: App
  test_event: string
  partner_id: string
}

export interface ProductContextItem {
  id: string
  item_price?: number
  quantity?: number
}

export interface Custom {
  order_value?: string
  order_id?: string
  delivery_category?: string
  product_context?: Array<ProductContextItem>
}

export interface App {
  app_id?: string
  app_tracking_enabled?: boolean
  platform?: string
  app_version?: string
}
