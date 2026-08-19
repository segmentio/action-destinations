export const ACTION_SOURCE_V3 = ['WEBSITE', 'APP', 'OTHER', 'PHYSICAL_STORE'] as const

export const ACTION_SOURCE_V3_LABELS: Record<typeof ACTION_SOURCE_V3[number], string> = {
  WEBSITE: 'Website',
  APP: 'App',
  OTHER: 'Other',
  PHYSICAL_STORE: 'Offline (Physical Store)'
}

export const EVENT_TYPE_V3 = [
  'PAGE_VISIT',
  'VIEW_CONTENT',
  'SEARCH',
  'ADD_TO_CART',
  'ADD_TO_WISHLIST',
  'PURCHASE',
  'LEAD',
  'SIGN_UP',
  'CUSTOM'
] as const

// v2 tracking_type (mixed case) -> v3 UPPER_SNAKE_CASE.
export const TRACKING_TYPE_V3: Record<string, typeof EVENT_TYPE_V3[number]> = {
  PageVisit: 'PAGE_VISIT',
  ViewContent: 'VIEW_CONTENT',
  Search: 'SEARCH',
  AddToCart: 'ADD_TO_CART',
  AddToWishlist: 'ADD_TO_WISHLIST',
  Purchase: 'PURCHASE',
  Lead: 'LEAD',
  SignUp: 'SIGN_UP',
  Custom: 'CUSTOM'
}
