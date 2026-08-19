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
  event_source_url
} from './fields'

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
      event_source_url
    },
    perform: async (request, { settings, payload }) => {
      const resolvedPayload = resolvePayload(payload) as StandardEvent
      return resolveVersion(payload.api_version) === LATEST_API_VERSION
        ? sendV3(request, settings, [resolvedPayload], false)
        : send(request, settings, [resolvedPayload])
    },
    performBatch: async (request, { settings, payload }) => {
      const resolvedPayloads = payload.map(resolvePayload) as StandardEvent[]

      // api_version is a static per-mapping setting, not derived from event data, so a batch is
      // always homogeneously all-V2 or all-V3 - checking the first payload is enough.
      return resolveVersion(resolvedPayloads[0]?.api_version) === LATEST_API_VERSION
        ? sendV3(request, settings, resolvedPayloads, true)
        : send(request, settings, resolvedPayloads)
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
