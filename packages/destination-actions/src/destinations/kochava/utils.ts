import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { TRACK_ENDPOINT } from './constants'
import type { KochavaActionType } from './constants'
import type {
  KochavaActionPayload,
  KochavaAppTrackingTransparency,
  KochavaData,
  KochavaDeviceIds,
  KochavaResponse,
  KochavaTrackRequest
} from './types'

/**
 * Convert a Segment timestamp (ISO string, Date, or epoch ms) into Kochava's
 * `usertime`, which the API expects as epoch **seconds**.
 */
function toEpochSeconds(value?: string | number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const ms = new Date(value).getTime()
  if (Number.isNaN(ms)) return undefined
  return Math.floor(ms / 1000)
}

/**
 * Assemble Kochava's `device_ids` object from the individual identifier fields,
 * keeping only those with a non-empty value.
 */
function buildDeviceIds(payload: KochavaActionPayload): KochavaDeviceIds {
  const result: KochavaDeviceIds = {}
  const candidates: Array<[keyof KochavaDeviceIds, string | undefined]> = [
    ['idfa', payload.idfa],
    ['idfv', payload.idfv],
    ['adid', payload.adid],
    ['android_id', payload.android_id]
  ]
  for (const [key, val] of candidates) {
    if (val !== undefined && val !== null && String(val).length > 0) {
      result[key] = String(val)
    }
  }
  return result
}

function buildAppTrackingTransparency(payload: KochavaActionPayload): KochavaAppTrackingTransparency | undefined {
  const { att, att_time, att_duration, att_detail } = payload
  if (att === undefined && att_time === undefined && att_duration === undefined && att_detail === undefined) {
    return undefined
  }
  return { att, att_time, att_duration, att_detail }
}

function buildData(payload: KochavaActionPayload, deviceIds: KochavaDeviceIds): KochavaData {
  const data: KochavaData = {
    device_ids: deviceIds,
    // Kochava expects a URL-encoded user agent string.
    device_ua: payload.device_ua ? encodeURIComponent(payload.device_ua) : undefined,
    device_ver: payload.device_ver,
    origination_ip: payload.origination_ip,
    app_version: payload.app_version,
    usertime: toEpochSeconds(payload.usertime),
    event_name: payload.event_name,
    event_data: payload.event_data,
    currency: payload.currency,
    ad_services_token: payload.ad_services_token,
    app_tracking_transparency: buildAppTrackingTransparency(payload)
  }

  // `device_limit_tracking` is the inverse of Segment's `context.device.adTrackingEnabled`.
  if (payload.ad_tracking_enabled !== undefined) {
    data.device_limit_tracking = !payload.ad_tracking_enabled
  }

  return data
}

/**
 * Build a fully-typed Kochava /track/json request body for the given action.
 * Throws PayloadValidationError when Kochava's minimum requirements aren't met.
 */
export function buildTrackRequest(
  payload: KochavaActionPayload,
  settings: Settings,
  action: KochavaActionType
): KochavaTrackRequest {
  const kochavaAppId = payload.kochava_app_id || settings.kochava_app_id
  if (!kochavaAppId) {
    throw new PayloadValidationError('A Kochava App ID (App GUID) is required.')
  }

  const deviceIds = buildDeviceIds(payload)
  if (Object.keys(deviceIds).length === 0) {
    throw new PayloadValidationError('At least one device identifier (IDFA, IDFV, ADID, or Android ID) is required.')
  }

  return {
    action,
    kochava_app_id: kochavaAppId,
    kochava_device_id: payload.kochava_device_id,
    data: buildData(payload, deviceIds)
  }
}

export function sendEvent(
  request: RequestClient,
  settings: Settings,
  payload: KochavaActionPayload,
  action: KochavaActionType
) {
  const body = buildTrackRequest(payload, settings, action)
  return request<KochavaResponse>(TRACK_ENDPOINT, {
    method: 'POST',
    json: body
  })
}
