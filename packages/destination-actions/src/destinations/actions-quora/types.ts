/**
 * Request/response interfaces for the Quora Conversions API.
 * See: https://www.quora.com/ads/conversion_api_doc
 */

/** The `user` object of a Quora conversion event. */
export interface QuoraUser {
  email?: string
  name?: string
  phone_number?: string
  date_of_birth?: string
  ip?: string
  country?: string
  region?: string
  city?: string
  postal_code?: string
}

/** The `device` object of a Quora conversion event. */
export interface QuoraDevice {
  mobile_device_id?: string
  user_agent?: string
  language?: string
  // Note: the API spells this `referer` with a single "r".
  referer?: string
}

/** The `conversion` object of a Quora conversion event. */
export interface QuoraConversion {
  event_name: string
  timestamp?: number
  click_id?: string
  value?: number
  event_id?: string
}

/** A single conversion event as sent inside a batch `data[]` array. */
export interface QuoraConversionItem {
  user?: QuoraUser
  device?: QuoraDevice
  conversion: QuoraConversion
}

/** Body of the single-event endpoint `POST /ads/v0/conversion`. */
export interface QuoraSingleRequest extends QuoraConversionItem {
  account_id: number
}

/** Body of the batch endpoint `POST /ads/v0/conversions`. */
export interface QuoraBatchRequest {
  account_id: number
  data: QuoraConversionItem[]
}

/** Per-item result inside a multi-status batch response. */
export interface QuoraEventResult {
  status: string
  index: number
  error_code?: string
  error_message?: string
}

/** Body returned by the batch endpoint (HTTP 200 multi-status). */
export interface QuoraBatchResponse {
  events_received?: number
  events_errored?: number
  events?: QuoraEventResult[]
}

/** Body returned by the single-event endpoint. */
export interface QuoraSingleResponse {
  events_received?: number
  events_errored?: number
  events?: QuoraEventResult[]
}
