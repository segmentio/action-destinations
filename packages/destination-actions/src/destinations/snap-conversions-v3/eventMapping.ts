// Event name mapping from Segment events to Snapchat event names
export const EVENT_NAME_MAPPING: Record<string, string> = {
  'Product Added': 'ADD_CART',
  'Product Added to Wishlist': 'ADD_TO_WISHLIST', 
  'Checkout Started': 'START_CHECKOUT',
  'Order Completed': 'PURCHASE',
  'Product Viewed': 'VIEW_CONTENT',
  'Products Searched': 'SEARCH',
  'Signed Up': 'SIGN_UP',
  'Login': 'LOGIN',
  'Signed In': 'LOGIN',
  'Page Viewed': 'PAGE_VIEW',
  'Application Installed': 'APP_INSTALL',
  'Application Opened': 'APP_OPEN',
  'Product List Viewed': 'LIST_VIEW',
  'Shared': 'SHARE',
  'Product Shared': 'SHARE',
  'Payment Info Entered': 'ADD_BILLING'
}

/**
 * Maps a Segment event name to the corresponding Snapchat event name
 * Returns the original event name if no mapping is found
 */
export function mapEventName(segmentEventName: string | undefined): string | undefined {
  if (!segmentEventName) {
    return undefined
  }
  
  return EVENT_NAME_MAPPING[segmentEventName] || segmentEventName
}