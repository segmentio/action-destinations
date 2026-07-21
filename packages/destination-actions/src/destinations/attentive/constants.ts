export const API_URL = 'https://api.attentivemobile.com'
export const API_VERSION = 'v1'
export const MARKETING = 'MARKETING' as const
export const TRANSACTIONAL = 'TRANSACTIONAL' as const 
export const SUBSCRIPTION_TYPES = [MARKETING, TRANSACTIONAL] as const 
export const SUBSCRIPTION_TYPE_CHOICES = [
  { label: MARKETING, value: MARKETING },
  { label: TRANSACTIONAL, value: TRANSACTIONAL }
]