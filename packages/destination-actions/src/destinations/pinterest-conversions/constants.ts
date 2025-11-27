import { PINTEREST_CONVERSIONS_API_VERSION } from './versioning-info'

export const API_VERSION = PINTEREST_CONVERSIONS_API_VERSION
export const EVENT_NAME = {
  ADD_TO_CART: 'add_to_cart',
  CHECKOUT: 'checkout',
  CUSTOM: 'custom',
  LEAD: 'lead',
  PAGE_VISIT: 'page_visit',
  SEARCH: 'search',
  SIGNUP: 'search',
  VIEW_CATEGORY: 'view_category',
  WATCH_VIDEO: 'watch_video'
}
export const ACTION_SOURCE = ['app_android', 'app_ios', 'web', 'offline']
export const PARTNER_NAME = 'ss-segment'
