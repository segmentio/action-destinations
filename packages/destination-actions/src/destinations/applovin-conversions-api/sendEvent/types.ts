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
  data: { items: CheckoutItem[]; currency: string; value: number }
}

type AddPaymentInfoEvent = BaseEvent<'add_payment_info'> & {
  data: { items?: AppLovinItem[]; currency?: string; value?: number; payment_type?: string }
}

type PurchaseEvent = BaseEvent<'purchase'> & {
  data: {
    items: CheckoutItem[]
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

// Requires at least one key of T to be set. The other keys stay optional.
type AtLeastOne<T> = { [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>> }[keyof T]

// AppLovin rejects events that have none of these identifiers.
type Identifiers = AtLeastOne<{ client_id: string; user_id: string; email: string; phone: string }>

// Web events must say which page they came from. App events can omit the URL.
type Source =
  | { event_source_url: string; user_data: { esi: 'web' } }
  | { event_source_url?: string; user_data: { esi: 'app' } }

type BaseEvent<N extends EventName> = Source & {
  name: N
  event_time: number
  dedupe_id: string
  user_data: Identifiers & {
    client_ip_address: string
    client_user_agent: string
    aleid?: string
    alart?: string
    axwrt?: string
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

// add_to_cart and remove_from_cart items only need a quantity.
type CartItem = AppLovinItem & { quantity: number }

// begin_checkout and purchase: AppLovin rejects the whole event if any item lacks these.
type CheckoutItem = AppLovinItem & { item_name: string; price: number; quantity: number }

export interface ParsedCurrency {
  code?: string
  error?: string
}

export interface ValidationInput {
  event_time: number
  name: EventName
  client_ip_address?: string
  client_user_agent?: string
  dedupe_id?: string
  transaction_id?: string
  search_term?: string
  items?: Payload['items']
  aleid?: string
  esi?: string
  event_source_url?: string
  hasIdentifier: boolean
  currency: ParsedCurrency
}
