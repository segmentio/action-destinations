import { mapEventName, EVENT_NAME_MAPPING } from '../eventMapping'

describe('Event Name Mapping', () => {
  it('should map known Segment events to Snapchat event names', () => {
    expect(mapEventName('Product Added')).toBe('ADD_CART')
    expect(mapEventName('Product Viewed')).toBe('VIEW_CONTENT')
    expect(mapEventName('Order Completed')).toBe('PURCHASE')
    expect(mapEventName('Checkout Started')).toBe('START_CHECKOUT')
    expect(mapEventName('Signed Up')).toBe('SIGN_UP')
    expect(mapEventName('Login')).toBe('LOGIN')
    expect(mapEventName('Signed In')).toBe('LOGIN')
  })

  it('should return original event name for unknown events', () => {
    expect(mapEventName('Custom Event')).toBe('Custom Event')
    expect(mapEventName('CUSTOM_EVENT_1')).toBe('CUSTOM_EVENT_1')
  })

  it('should handle undefined event names', () => {
    expect(mapEventName(undefined)).toBeUndefined()
  })

  it('should include all required mappings from specification', () => {
    // Verify all mappings from the issue specification are included
    const requiredMappings = {
      'Product Added': 'ADD_CART',
      'Product Added to Wishlist': 'ADD_TO_WISHLIST',
      'Checkout Started': 'START_CHECKOUT',
      'Order Completed': 'PURCHASE',
      'Product Viewed': 'VIEW_CONTENT',
      'Products Searched': 'SEARCH',
      'Signed Up': 'SIGN_UP',
      'Login': 'LOGIN',
      'Page Viewed': 'PAGE_VIEW',
      'Application Installed': 'APP_INSTALL',
      'Application Opened': 'APP_OPEN',
      'Product List Viewed': 'LIST_VIEW',
      'Shared': 'SHARE',
      'Payment Info Entered': 'ADD_BILLING'
    }

    Object.entries(requiredMappings).forEach(([segmentEvent, snapchatEvent]) => {
      expect(EVENT_NAME_MAPPING[segmentEvent]).toBe(snapchatEvent)
    })
  })
})