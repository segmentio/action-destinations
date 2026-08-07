import type { Features, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './standardEvent/generated-types'
import type { Payload as CustomEvent } from './customEvent/generated-types'
import { REDDIT_CONVERSIONS_API_VERSION, REDDIT_CONVERSIONS_CANARY_API_VERSION } from './versioning-info'
import { sendV2 } from './v2'
import { sendV3 } from './v3'

export const API_VERSION = REDDIT_CONVERSIONS_API_VERSION
export const CANARY_API_VERSION = REDDIT_CONVERSIONS_CANARY_API_VERSION
export const FLAGON_NAME = 'reddit-conversions-api-canary-version'

export function isCanary(features?: Features): boolean {
  return !!(features && features[FLAGON_NAME])
}

// Single flag fork: v3 (canary) or v2 (stable). Cleanup at flag removal = delete
// v2.ts, drop this branch, call sendV3 directly.
export async function send(
  request: RequestClient,
  settings: Settings,
  payload: StandardEvent[] | CustomEvent[],
  features?: Features
) {
  return isCanary(features) ? sendV3(request, settings, payload) : sendV2(request, settings, payload)
}
