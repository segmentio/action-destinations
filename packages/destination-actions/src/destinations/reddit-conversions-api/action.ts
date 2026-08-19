import type { ActionDefinition, InputField } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './standardEvent/generated-types'
import type { Payload as CustomEvent } from './customEvent/generated-types'
import { send } from './utils'
import { sendV3 } from './v3/utils-v3'
import { LEGACY_API_VERSION, LATEST_API_VERSION, ApiVersion } from './versioning-info'
import {
  event_at,
  tracking_type,
  custom_event_name,
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

/** resolveVersion
 * Decides which Reddit Conversions API version a given event should use, based on the
 * per-action `api_version` field. Existing customers who configured this action before the
 * field existed have no value for it (resolves to `undefined` here), so they stay on v2 too,
 * until they explicitly opt into `'v3'`.
 */
export function resolveVersion(apiVersion: string | undefined): ApiVersion {
  return apiVersion === LATEST_API_VERSION ? LATEST_API_VERSION : LEGACY_API_VERSION
}

function buildEventAction<Payload extends StandardEvent | CustomEvent>(
  // Exactly one of these is passed per action variant; the other stays undefined and is omitted
  // from fields. trackingTypeField is also omitted for standardEvent's hardcoded-trackingType
  // presets, where the value is fixed rather than user-selectable.
  trackingTypeField: InputField | undefined,
  customEventNameField: InputField | undefined,
  title: string,
  description: string,
  defaultSubscription: string | undefined,
  resolvePayload: (payload: Payload) => Payload
): ActionDefinition<Settings, Payload> {
  return {
    title,
    description,
    defaultSubscription,
    fields: {
      event_at,
      ...(trackingTypeField ? { tracking_type: trackingTypeField } : {}),
      ...(customEventNameField ? { custom_event_name: customEventNameField } : {}),
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
    perform: async (request, { settings, payload }) => {
      const resolvedPayload = resolvePayload(payload) as StandardEvent
      return resolveVersion(payload.api_version) === LATEST_API_VERSION
        ? sendV3(request, settings, [resolvedPayload])
        : send(request, settings, [resolvedPayload])
    },
    performBatch: async (request, { settings, payload }) => {
      const resolvedPayloads = payload.map(resolvePayload) as StandardEvent[]
      const v2Payloads = resolvedPayloads.filter((p) => resolveVersion(p.api_version) === LEGACY_API_VERSION)
      const v3Payloads = resolvedPayloads.filter((p) => resolveVersion(p.api_version) === LATEST_API_VERSION)
      const requests = []
      if (v2Payloads.length) requests.push(send(request, settings, v2Payloads))
      if (v3Payloads.length) requests.push(sendV3(request, settings, v3Payloads))
      return Promise.all(requests)
    }
  }
}

export function standardEventAction<Payload extends StandardEvent>(
  // When set, tracking_type is hardcoded to this value and hidden from the UI, replicating
  // the old per-event-type presets. When undefined, tracking_type stays a user-selectable field.
  trackingType: string | undefined,
  title: string,
  description: string,
  defaultSubscription?: string
): ActionDefinition<Settings, Payload> {
  return buildEventAction<Payload>(
    trackingType ? undefined : tracking_type,
    undefined,
    title,
    description,
    defaultSubscription,
    (payload) => (trackingType ? { ...payload, tracking_type: trackingType } : payload)
  )
}

export function customEventAction<Payload extends CustomEvent>(
  title: string,
  description: string,
  defaultSubscription?: string
): ActionDefinition<Settings, Payload> {
  return buildEventAction<Payload>(
    undefined,
    custom_event_name,
    title,
    description,
    defaultSubscription,
    (payload) => payload
  )
}
