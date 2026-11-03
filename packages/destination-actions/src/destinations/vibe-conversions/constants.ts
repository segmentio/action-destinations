export const BASE_URL = 'https://t.vibe.co'
export const CONVERSION_ENDPOINT = `${BASE_URL}/s2s-conversion/events/segment`

// Allowed values for the `a` (action / event type) field.
export const EVENT_TYPES = ['call', 'install', 'lead', 'page_view', 'purchase', 'signup'] as const

// Events must have a timestamp within the last 7 days.
export const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000
