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
  batch_size,
  event_metadata,
  conversion_id,
  api_version,
  action_source,
  event_source_url
} from './fields'

const BASE64_HASHING_FLAG = 'actions-reddit-conversions-api-base64-hashing'

export function resolveVersion(apiVersion: string | undefined): ApiVersion {
  return apiVersion === LATEST_API_VERSION ? LATEST_API_VERSION : LEGACY_API_VERSION
}

function buildEventAction<Payload extends StandardEvent | CustomEvent>(
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
      api_version,
      action_source,
      event_at,
      ...(trackingTypeField ? { tracking_type: trackingTypeField } : {}),
      ...(customEventNameField ? { custom_event_name: customEventNameField } : {}),
      event_source_url,
      click_id,
      products,
      user,
      data_processing_options,
      screen_dimensions,
      event_metadata,
      conversion_id,
      batch_size
    },
    perform: async (request, { settings, payload, features }) => {
      const resolvedPayload = resolvePayload(payload)
      const base64Hashing = Boolean(features?.[BASE64_HASHING_FLAG])
      return resolveVersion(payload.api_version) === LATEST_API_VERSION
        ? sendV3(request, settings, [resolvedPayload], false, base64Hashing)
        : send(request, settings, [resolvedPayload], base64Hashing)
    },
    performBatch: async (request, { settings, payload, features }) => {
      const resolvedPayloads = payload.map(resolvePayload)
      const base64Hashing = Boolean(features?.[BASE64_HASHING_FLAG])

      // api_version is a static per-mapping setting, not derived from event data, so a batch is
      // always homogeneously all-V2 or all-V3 - checking the first payload is enough.
      return resolveVersion(resolvedPayloads[0]?.api_version) === LATEST_API_VERSION
        ? sendV3(request, settings, resolvedPayloads, true, base64Hashing)
        : send(request, settings, resolvedPayloads, base64Hashing)
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
