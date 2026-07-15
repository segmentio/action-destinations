/**
 * Base host for the Quora Conversions API.
 */
export const BASE_URL = 'https://api.quora.com'

/**
 * Single-event conversion endpoint. Backs `perform`.
 * Body shape: { user, device, conversion, account_id }
 */
export const SINGLE_ENDPOINT = `${BASE_URL}/ads/v0/conversion`

/**
 * Batch conversion endpoint. Backs `performBatch` (preferred delivery path).
 * Body shape: { account_id, data: [ { user, device, conversion }, ... ] }
 * Accepts up to 1,000 events per request and returns an HTTP 200 multi-status body.
 */
export const BATCH_ENDPOINT = `${BASE_URL}/ads/v0/conversions`

/**
 * Maximum number of events Quora accepts in a single batch request.
 */
export const MAX_BATCH_SIZE = 1000

/**
 * HTTP status codes Segment treats as retryable (see actions-core `errors.ts`).
 * When a batch request comes back with one of these, the whole batch is retried
 * rather than marking individual events errored.
 */
export const RETRYABLE_STATUS_CODES = new Set([408, 423, 429, 500, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 598, 599])

/**
 * The ten standard Quora conversion types.
 */
export const QUORA_EVENT_NAMES = [
  'Generic',
  'AppInstall',
  'Purchase',
  'GenerateLead',
  'CompleteRegistration',
  'AddPaymentInfo',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'Search'
] as const

export type QuoraEventName = typeof QUORA_EVENT_NAMES[number]
