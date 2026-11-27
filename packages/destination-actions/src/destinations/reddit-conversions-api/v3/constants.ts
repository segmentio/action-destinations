export const ACTION_SOURCE_V3_LABELS = {
  WEBSITE: 'Website',
  APP: 'App',
  OTHER: 'Other',
  PHYSICAL_STORE: 'Offline (Physical Store)'
} as const

// v2 tracking_type (mixed case) -> v3 UPPER_SNAKE_CASE.
export const TRACKING_TYPE_V3 = {
  PageVisit: 'PAGE_VISIT',
  ViewContent: 'VIEW_CONTENT',
  Search: 'SEARCH',
  AddToCart: 'ADD_TO_CART',
  AddToWishlist: 'ADD_TO_WISHLIST',
  Purchase: 'PURCHASE',
  Lead: 'LEAD',
  SignUp: 'SIGN_UP',
  Custom: 'CUSTOM'
} as const

export const ISO_4217 = /^[A-Z]{3}$/

export const CUSTOM_EVENT_NAME_MAX_LENGTH = 64

export const EVENT_AT_MAX_AGE_MS = 168 * 60 * 60 * 1000

export const SUPPORTS_VALUE_METADATA: ReadonlySet<string> = new Set<keyof typeof TRACKING_TYPE_V3>([
  'AddToCart',
  'AddToWishlist',
  'Purchase',
  'Lead',
  'SignUp',
  'Custom'
])

export const SUPPORTS_ITEM_COUNT: ReadonlySet<string> = new Set<keyof typeof TRACKING_TYPE_V3>([
  'AddToCart',
  'AddToWishlist',
  'Purchase',
  'Custom'
])

export const MATCH_KEYS = [
  'idfa',
  'aaid',
  'email',
  'external_id',
  'ip_address',
  'user_agent',
  'uuid',
  'phone_number'
] as const
