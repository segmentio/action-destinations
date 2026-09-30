import { GAINTRACE_API_VERSION } from './versioning-info'

export const API_BASE = `https://app.gaintrace.com/api/${GAINTRACE_API_VERSION}`
export const REQUEST_TIMEOUT_MS = 30_000
export const MAX_EVENTS_PER_REQUEST = 1000
export const EVENT_CATEGORIES = [
  'feature_usage',
  'navigation',
  'api',
  'billing',
  'support',
  'auth',
  'integration',
  'admin'
]
