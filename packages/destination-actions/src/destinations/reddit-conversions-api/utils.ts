import type { Features } from '@segment/actions-core'

/** FLAGON_NAME
 * Flagon flag gating whether Reddit Conversions API v3 is reachable at all for an account.
 * https://flagon.segment.com/families/centrifuge-destinations/gates/reddit-conversions-api-canary-version
 */
export const FLAGON_NAME = 'reddit-conversions-api-canary-version'

export function isCanary(features?: Features): boolean {
  return !!(features && features[FLAGON_NAME])
}

/** resolveVersion
 * Decides which Reddit Conversions API version a given event should use.
 *
 * The Flagon flag is the ops-level rollout/kill-switch: if it's off, every event stays on v2,
 * regardless of the customer's `api_version` field selection. If the flag is on, the customer's
 * per-action `api_version` field decides: existing customers who configured this action before
 * the field existed have no value for it (resolves to `undefined` here), so they stay on v2 too,
 * until they explicitly opt into `'v3'`.
 */
export function resolveVersion(apiVersion: string | undefined, features?: Features): 'v2' | 'v3' {
  if (!isCanary(features)) {
    return 'v2'
  }
  return apiVersion === 'v3' ? 'v3' : 'v2'
}
