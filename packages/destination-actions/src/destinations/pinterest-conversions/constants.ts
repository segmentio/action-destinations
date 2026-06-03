import { PINTEREST_CONVERSIONS_API_VERSION } from './versioning-info'

export const API_VERSION = PINTEREST_CONVERSIONS_API_VERSION
export const EVENT_NAME = {
  ADD_PAYMENT_INFO: 'add_payment_info',
  ADD_TO_CART: 'add_to_cart',
  ADD_TO_WISHLIST: 'add_to_wishlist',
  APP_INSTALL: 'app_install',
  APP_OPEN: 'app_open',
  CHECKOUT: 'checkout',
  CONTACT: 'contact',
  CUSTOM: 'custom',
  CUSTOMIZE_PRODUCT: 'customize_product',
  FIND_LOCATION: 'find_location',
  INITIATE_CHECKOUT: 'initiate_checkout',
  LEAD: 'lead',
  PAGE_VISIT: 'page_visit',
  SCHEDULE: 'schedule',
  SEARCH: 'search',
  SIGNUP: 'signup',
  START_TRIAL: 'start_trial',
  SUBMIT_APPLICATION: 'submit_application',
  SUBSCRIBE: 'subscribe',
  VIEW_CATEGORY: 'view_category',
  VIEW_CONTENT: 'view_content',
  WATCH_VIDEO: 'watch_video'
}
export const ACTION_SOURCE = ['app_android', 'app_ios', 'web', 'offline']
export const PARTNER_NAME = 'ss-segment'
