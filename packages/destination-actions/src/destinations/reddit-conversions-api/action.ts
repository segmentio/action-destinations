import type { ActionDefinition, Features } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './standardEvent/generated-types'
import { send } from './utils'
import { sendV3, FLAGON_NAME } from './v3/utils-v3'
import { LEGACY_API_VERSION, LATEST_API_VERSION, ApiVersion } from './versioning-info'
import {
  event_at,
  tracking_type,
  click_id,
  products,
  user,
  data_processing_options,
  screen_dimensions,
  event_metadata,
  conversion_id,
  api_version,
  action_source,
  event_source_url,
  test_id
} from './fields'

export function isCanary(features?: Features): boolean {
  return features?.[FLAGON_NAME] ?? false
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
export function resolveVersion(apiVersion: string | undefined, features?: Features): ApiVersion {
  if (!isCanary(features)) {
    return LEGACY_API_VERSION
  }
  return apiVersion === LATEST_API_VERSION ? LATEST_API_VERSION : LEGACY_API_VERSION
}

export function standardEventAction<Payload extends StandardEvent>(
  // When set, tracking_type is hardcoded to this value and hidden from the UI, replicating
  // the old per-event-type presets. When undefined, tracking_type stays a user-selectable field.
  trackingType: string | undefined,
  title: string,
  description: string,
  defaultSubscription?: string
): ActionDefinition<Settings, Payload> {
  return {
    title,
    description,
    defaultSubscription,
    fields: {
      event_at,
      ...(trackingType ? {} : { tracking_type }),
      click_id,
      products,
      user,
      data_processing_options,
      screen_dimensions,
      event_metadata,
      conversion_id,
      api_version,
      action_source,
      event_source_url,
      test_id
    },
    perform: async (request, { settings, payload, features }) => {
      const resolvedPayload = trackingType ? { ...payload, tracking_type: trackingType } : payload
      return resolveVersion(payload.api_version, features) === LATEST_API_VERSION
        ? sendV3(request, settings, [resolvedPayload])
        : send(request, settings, [resolvedPayload])
    },
    performBatch: async (request, { settings, payload, features }) => {
      const resolvedPayloads = trackingType ? payload.map((p) => ({ ...p, tracking_type: trackingType })) : payload
      const v2Payloads = resolvedPayloads.filter((p) => resolveVersion(p.api_version, features) === LEGACY_API_VERSION)
      const v3Payloads = resolvedPayloads.filter((p) => resolveVersion(p.api_version, features) === LATEST_API_VERSION)
      const requests = []
      if (v2Payloads.length) requests.push(send(request, settings, v2Payloads))
      if (v3Payloads.length) requests.push(sendV3(request, settings, v3Payloads))
      return Promise.all(requests)
    }
  }
}
