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
