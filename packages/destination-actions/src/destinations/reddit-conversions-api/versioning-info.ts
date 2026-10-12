/** Reddit Conversions API versions.
 * v2.0 changelog: https://ads-api.reddit.com/docs/v2/changelog
 * v3 changelog: https://ads-api.reddit.com/docs/v3/changelog
 * These values are sent in the request path, so they must match Reddit's published versions.
 */
export const LEGACY_API_VERSION = 'v2.0'
export const LATEST_API_VERSION = 'v3'
export type ApiVersion = typeof LEGACY_API_VERSION | typeof LATEST_API_VERSION
