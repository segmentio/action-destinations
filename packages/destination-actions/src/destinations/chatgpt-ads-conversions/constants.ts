import { CHATGPT_ADS_CONVERSIONS_API_VERSION } from './versioning-info'

export const API_URL = `https://bzr.openai.com/${CHATGPT_ADS_CONVERSIONS_API_VERSION}/events`

export const EVENT_DATA_TYPES = {
  appointment_scheduled: 'customer_action',
  checkout_started: 'contents',
  contents_viewed: 'contents',
  items_added: 'contents',
  lead_created: 'customer_action',
  order_created: 'contents',
  page_viewed: 'contents',
  registration_completed: 'customer_action',
  subscription_created: 'plan_enrollment',
  trial_started: 'plan_enrollment',
  custom: 'custom'
} as const

export const HASH_LIST_FIELDS = [
  'emails_sha256',
  'external_ids_sha256',
  'phone_numbers_sha256',
  'first_names_sha256',
  'last_names_sha256'
] as const

export const GEO_LIST_FIELDS = ['countries', 'cities', 'regions', 'postal_codes'] as const
