import type { EventName } from './constants'
import type { Payload } from './generated-types'

export interface AppLovinRequest {
  events: AppLovinEvent[]
}

export type AppLovinEvent =
  | PageViewEvent
  | ViewItemEvent
  | AddToCartEvent
  | RemoveFromCartEvent
  | ViewCartEvent
  | BeginCheckoutEvent
  | AddPaymentInfoEvent
  | PurchaseEvent
  | GenerateLeadEvent
  | LoginEvent
  | SignUpEvent
  | SearchEvent
  | SubscribeEvent
  | AppOpenEvent

type PageViewEvent = BaseEvent<'page_view'> & { data: null }

type ViewItemEvent = BaseEvent<'view_item'> & {
  data: { items: AppLovinItem[]; currency?: string; value?: number }
}

type AddToCartEvent = BaseEvent<'add_to_cart'> & {
  data: { items: CartItem[]; currency?: string; value?: number }
}

type RemoveFromCartEvent = BaseEvent<'remove_from_cart'> & {
  data: { items: CartItem[]; currency?: string; value?: number }
}

type ViewCartEvent = BaseEvent<'view_cart'> & {
  data: { items: AppLovinItem[]; currency?: string; value?: number }
}

type BeginCheckoutEvent = BaseEvent<'begin_checkout'> & {
  data: { items: AppLovinItem[]; currency: string; value: number }
}

type AddPaymentInfoEvent = BaseEvent<'add_payment_info'> & {
  data: { items?: AppLovinItem[]; currency?: string; value?: number; payment_type?: string }
}

type PurchaseEvent = BaseEvent<'purchase'> & {
  data: {
    items: CartItem[]
    currency: string
    value: number
    transaction_id: string
    shipping: number
    tax: number
    is_new_customer?: boolean
  }
}

type GenerateLeadEvent = BaseEvent<'generate_lead'> & {
  data: { currency: string; value: number }
}

type LoginEvent = BaseEvent<'login'> & { data: Record<string, never> }

type SignUpEvent = BaseEvent<'sign_up'> & { data: { method?: string } }

type SearchEvent = BaseEvent<'search'> & { data: { search_term: string } }

type SubscribeEvent = BaseEvent<'subscribe'> & { data: { currency?: string; value?: number } }

type AppOpenEvent = BaseEvent<'app_open'>

interface BaseEvent<N extends EventName> {
  name: N
  event_time: number
  event_source_url?: string
  dedupe_id: string
  user_data: {
    client_ip_address: string
    client_user_agent: string
    esi: 'web' | 'app'
    aleid?: string
    alart?: string
    axwrt?: string
    client_id?: string
    user_id?: string
    email?: string
    phone?: string
    phone_last10_hashed?: string
    ifa?: string
    idfv?: string
    os?: AppLovinOs
    sid?: string
    country_code?: string
    zip?: string
  }
}

export type AppLovinOs = 'ios' | 'android' | 'macos' | 'windows' | 'desktop_os'

export interface AppLovinItem {
  item_id: string
  item_name?: string
  item_brand?: string
  item_variant_id?: string
  item_category_id?: number
  image_url?: string
  price?: number
  quantity?: number
  discount?: number
  affiliation?: string
}

type CartItem = AppLovinItem & { quantity: number }

export interface ParsedCurrency {
  code?: string
  error?: string
}

export interface ValidationInput {
  name: EventName
  client_ip_address?: string
  client_user_agent?: string
  dedupe_id?: string
  transaction_id?: string
  search_term?: string
  items?: Payload['items']
  aleid?: string
  hasOtherIdentifier: boolean
  currency: ParsedCurrency
}
