/**
 * AppsFlyer API endpoints.
 *
 * In-app events use the v3 API. The v2 API (api2.appsflyer.com) that the classic
 * destination defaults to is deprecated — AppsFlyer revoked all v2 tokens issued
 * before 2026-03-10, and the v2 -> v3 switch is one-way.
 */
export const IN_APP_EVENT_BASE_URL = 'https://api3.appsflyer.com/inappevent'

/**
 * Install and app-open events use AppsFlyer's server-to-server endpoint, authenticated
 * with an `af_sig` HMAC query parameter rather than a header token. This endpoint is not
 * part of AppsFlyer's public documentation — it is a private integration path established
 * with AppsFlyer. Payload shapes here mirror the classic destination exactly.
 */
export const S2S_BASE_URL = 'https://s2s.appsflyer.com/v2.0'

/** AppsFlyer defaults event currency to USD when none is supplied. */
export const DEFAULT_CURRENCY = 'USD'

/** AppsFlyer rejects in-app event payloads larger than 1KB. */
export const MAX_IN_APP_PAYLOAD_BYTES = 1024

/** IDFA value reported by iOS when the user denies ad tracking. */
export const ZEROED_IDFA = '00000000-0000-0000-0000-000000000000'

/** Device types AppsFlyer accepts. Anything else is rejected. */
export const SUPPORTED_DEVICE_TYPES = ['ios', 'android', 'roku'] as const

export type DeviceType = typeof SUPPORTED_DEVICE_TYPES[number]
