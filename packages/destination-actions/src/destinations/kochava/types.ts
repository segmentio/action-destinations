import type { KochavaActionType } from './constants'

export interface KochavaDeviceIds {
  idfa?: string
  idfv?: string
  adid?: string
  android_id?: string
  [key: string]: string | undefined
}

export interface KochavaAppTrackingTransparency {
  att?: boolean
  att_time?: number
  att_duration?: number
  att_detail?: string
}

export interface KochavaData {
  device_ids: KochavaDeviceIds
  device_ua?: string
  device_ver?: string
  origination_ip?: string
  app_version?: string
  usertime?: number
  device_limit_tracking?: boolean
  event_name?: string
  event_data?: Record<string, unknown>
  currency?: string
  app_tracking_transparency?: KochavaAppTrackingTransparency
  ad_services_token?: string
}

export interface KochavaTrackRequest {
  action: KochavaActionType
  kochava_app_id: string
  kochava_device_id?: string
  data: KochavaData
}

export interface KochavaResponse {
  status?: string
}

/**
 * Structural superset of both action payloads (event + install). Every field is
 * optional so the generated per-action `Payload` types are assignable to it, which
 * lets `utils.ts` build a request body from either action without duplication.
 */
export interface KochavaActionPayload {
  kochava_app_id?: string
  kochava_device_id?: string
  idfa?: string
  idfv?: string
  adid?: string
  android_id?: string
  device_ua?: string
  device_ver?: string
  origination_ip?: string
  app_version?: string
  usertime?: string | number
  ad_tracking_enabled?: boolean
  event_name?: string
  event_data?: Record<string, unknown>
  currency?: string
  att?: boolean
  att_time?: number
  att_duration?: number
  att_detail?: string
  ad_services_token?: string
}
