export const API_BASE_URL = 'https://b.applovin.com'
export const MAX_BATCH_SIZE = 100
export const MIN_USER_ID_LENGTH = 6
export const MAX_EVENT_AGE_DAYS = 730
export const MAX_EVENT_FUTURE_HOURS = 1
export const INTEGRATION_NAME = 'AppLovin Conversions Api'

export const EVENT_NAMES = [
  'page_view',
  'view_item',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase',
  'generate_lead',
  'login',
  'sign_up',
  'search',
  'subscribe',
  'app_open'
] as const

export type EventName = typeof EVENT_NAMES[number]

export const EVENTS_REQUIRING_ITEMS: EventName[] = [
  'view_item',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'purchase'
]

export const EVENTS_WITH_ITEMS: EventName[] = [...EVENTS_REQUIRING_ITEMS, 'add_payment_info']

export const EVENTS_REQUIRING_QUANTITY: EventName[] = ['add_to_cart', 'remove_from_cart', 'purchase']

export const EVENTS_WITH_VALUE: EventName[] = [
  'view_item',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase',
  'generate_lead',
  'subscribe'
]

export const EVENTS_REQUIRING_VALUE: EventName[] = ['begin_checkout', 'purchase', 'generate_lead']

export const PAYMENT_TYPES = [
  'credit_card',
  'deferred',
  'redeemable',
  'payment_on_delivery',
  'wallet',
  'other'
] as const
