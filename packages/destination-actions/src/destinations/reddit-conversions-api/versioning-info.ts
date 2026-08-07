/** REDDIT_CONVERSIONS_API_VERSION
 * Reddit conversions API version (stable/production).
 * API reference: https://ads-api.reddit.com/docs/v2/changelog
 */
export const REDDIT_CONVERSIONS_API_VERSION = 'v2.0'

/** REDDIT_CONVERSIONS_CANARY_API_VERSION
 * Reddit conversions API version (canary/feature-flagged).
 * v3 is a breaking payload rewrite (new endpoint /api/v3/pixels/{pixel_id}/conversion_events,
 * `data` envelope, renamed/retyped fields). See v3.ts for the transform.
 * API reference: https://ads-api.reddit.com/docs/v3/capi-migration
 */
export const REDDIT_CONVERSIONS_CANARY_API_VERSION = 'v3'
