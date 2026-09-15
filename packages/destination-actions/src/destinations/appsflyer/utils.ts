import { createHmac } from 'crypto'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { DeviceType, IN_APP_EVENT_BASE_URL, S2S_BASE_URL, SUPPORTED_DEVICE_TYPES, ZEROED_IDFA } from './constants'
import {
  AppleSearchAds,
  AppsFlyerReferrer,
  GooglePlayReferrer,
  InAppEventRequest,
  S2SCommonPayload,
  S2SEventRequest
} from './types'
import type { Settings } from './generated-types'

/**
 * AppsFlyer only accepts ios, android and roku. The classic destination rejects anything
 * else outright rather than guessing, and we keep that behavior.
 */
export function normalizeDeviceType(deviceType: string | undefined): DeviceType {
  const normalized = deviceType?.toLowerCase()
  if (!normalized || !SUPPORTED_DEVICE_TYPES.includes(normalized as DeviceType)) {
    throw new PayloadValidationError(
      `AppsFlyer only supports ios, android and roku devices. Received "${deviceType ?? 'undefined'}". ` +
        'Set context.device.type to one of those values.'
    )
  }
  return normalized as DeviceType
}

/**
 * Selects the app ID for the device's platform. iOS app IDs are always prefixed with `id`
 * — AppsFlyer requires it and the settings UI rejects it, so we add it here.
 */
export function resolveAppId(settings: Settings, deviceType: DeviceType): string {
  if (deviceType === 'ios') {
    if (!settings.appleAppID) {
      throw new PayloadValidationError('iOS events require the Apple App ID setting to be configured.')
    }
    return `id${settings.appleAppID}`
  }

  if (deviceType === 'roku') {
    if (!settings.rokuAppID) {
      throw new PayloadValidationError('Roku events require the Roku App ID setting to be configured.')
    }
    return settings.rokuAppID
  }

  if (!settings.androidAppID) {
    throw new PayloadValidationError('Android events require the Android App ID setting to be configured.')
  }
  return settings.androidAppID
}

/** In-app events expect `YYYY-MM-DD HH:mm:ss.SSS` in UTC — a space, no `T`, and no `Z`. */
export function formatInAppEventTime(timestamp: string | number | undefined): string | undefined {
  if (!timestamp) return undefined
  return new Date(timestamp).toISOString().replace(/T/, ' ').slice(0, -1)
}

/** The S2S endpoint expects a full ISO timestamp with the trailing `Z` removed. */
export function formatS2STimestamp(timestamp: string | number): string {
  return new Date(timestamp).toISOString().replace('Z', '')
}

/**
 * AppsFlyer silently drops events whose `eventValue` is not a string, and expects every
 * primitive inside it to be quoted — booleans and numbers included. Events with no
 * properties must send an empty string rather than `{}`.
 */
export function stringifyEventValue(properties: Record<string, unknown> | undefined): string {
  if (!properties || Object.keys(properties).length === 0) return ''

  // `revenue` is AppsFlyer's reserved revenue field under a different name.
  const { revenue, ...rest } = properties
  const payload: Record<string, unknown> = { ...rest }
  if (revenue !== undefined && revenue !== null) payload.af_revenue = revenue

  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  )
  if (Object.keys(cleaned).length === 0) return ''

  return JSON.stringify(cleaned, (_key, value) => {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      return String(value)
    }
    return value
  })
}

/**
 * The S2S endpoint authenticates with an HMAC over the timestamp, IP and locale rather
 * than a header token, keyed with the account's dev key.
 */
export function generateAfSig(devKey: string, isoTimestamp: string, ip: string, lang: string): string {
  return createHmac('sha256', devKey).update(`${isoTimestamp}${ip}${lang}`).digest('hex')
}

/** Apple Search Ads campaign fields, mapped onto AppsFlyer's `iad-*` keys. */
export function mapAppleSearchAds(campaign: Record<string, unknown> | undefined): AppleSearchAds | undefined {
  if (!campaign) return undefined

  const mapped: AppleSearchAds = {
    'iad-campaign-name': campaign.name as string,
    'iad-keyword': campaign.content as string,
    'iad-org-name': campaign.ad_creative as string,
    'iad-adgroup-name': campaign.ad_group as string,
    'iad-adgroup-id': campaign.ad_group_id as string,
    'iad-campaign-id': campaign.id as string,
    'iad-attribution': campaign.attribution as string,
    'iad-lineitem-id': campaign.lineitem_id as string,
    'iad-lineitem-name': campaign.lineitem_name as string,
    'iad-click-date': normalizeCampaignDate(campaign.click_date),
    'iad-conversion-date': normalizeCampaignDate(campaign.conversion_date)
  }

  const cleaned = Object.fromEntries(
    Object.entries(mapped).filter(([, value]) => value !== undefined && value !== null)
  )
  return Object.keys(cleaned).length > 0 ? (cleaned as AppleSearchAds) : undefined
}

/** AppsFlyer expects Apple Search Ads dates truncated to whole seconds. */
function normalizeCampaignDate(input: unknown): string | undefined {
  if (!input) return undefined
  const parsed = new Date(input as string)
  if (isNaN(parsed.getTime())) return undefined
  return `${parsed.toISOString().split('.')[0]}Z`
}

/**
 * Remaps Google Play's install referrer keys onto AppsFlyer's. A non-array value is passed
 * through untouched, matching the classic destination.
 */
export function mapReferrers(referrers: unknown): AppsFlyerReferrer[] | unknown {
  if (!Array.isArray(referrers)) return referrers

  return (referrers as GooglePlayReferrer[]).map((referrer) => {
    const mapped: AppsFlyerReferrer = {
      source: referrer.source,
      type: referrer.type,
      referrer: referrer.install_referrer ?? referrer.referrer,
      click_ts: referrer.referrer_click_timestamp_seconds ?? referrer.click_ts,
      install_begin_ts: referrer.install_begin_timestamp_seconds ?? referrer.install_begin_ts,
      click_server_ts: referrer.referrer_click_timestamp_server_seconds ?? referrer.click_server_ts,
      install_begin_server_ts: referrer.install_begin_timestamp_server_seconds ?? referrer.install_begin_server_ts
    }

    return Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined)) as AppsFlyerReferrer
  })
}

/**
 * iOS reports ATT status explicitly. When it is absent on iOS 14.5+ AppsFlyer expects an
 * explicit 0 rather than an omitted field.
 */
export function resolveAtt(att: number | undefined, osVersion: string | undefined): number | undefined {
  if (att !== undefined && att !== null) return Number(att)
  if (osVersion && parseFloat(osVersion) >= 14.5) return 0
  return undefined
}

/**
 * AppsFlyer requires a device identifier. If the IDFA is absent or zeroed out — which is
 * what iOS reports once a user denies tracking — fall back to the vendor identifier.
 */
export function resolveIdfv(
  advertisingId: string | undefined,
  appsflyerId: string | undefined,
  deviceId: string | undefined
): string | undefined {
  if (!deviceId) return undefined
  if (!advertisingId) return deviceId
  if (advertisingId === ZEROED_IDFA && appsflyerId === ZEROED_IDFA) return deviceId
  return undefined
}

/** Removes keys with `undefined`/`null` values so we never send empty fields to AppsFlyer. */
export function compact<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null)) as T
}

export function sendInAppEvent(request: RequestClient, settings: Settings, appId: string, body: InAppEventRequest) {
  return request(`${IN_APP_EVENT_BASE_URL}/${appId}`, {
    method: 'POST',
    headers: {
      authentication: settings.s2sToken,
      'content-type': 'application/json'
    },
    json: body
  })
}

export function sendS2SEvent(
  request: RequestClient,
  settings: Settings,
  appId: string,
  body: S2SEventRequest,
  afSig: string
) {
  return request(`${S2S_BASE_URL}/${appId}`, {
    method: 'POST',
    searchParams: { af_sig: afSig },
    json: body
  })
}

/**
 * Builds the payload shared by Application Installed and Application Opened. The two events
 * post the same shape to the same endpoint and differ only in the install date, the counter
 * and whether the user already existed.
 */
export function buildS2SRequest(
  payload: S2SCommonPayload,
  deviceType: DeviceType,
  options: { instDate: string; counter: number; existingUser: 'true' | 'false' }
): S2SEventRequest {
  const isIos = deviceType === 'ios'
  const advertisingId = payload.advertising_id
  const appsflyerId = payload.appsflyer_id || advertisingId

  if (!appsflyerId) {
    throw new PayloadValidationError(
      'AppsFlyer requires a device identifier. Provide an AppsFlyer ID or an Advertising ID.'
    )
  }

  // The classic destination only sends `uid` when it has neither an explicit AppsFlyer ID
  // nor an advertising ID to identify the device with.
  const uid = payload.appsflyer_id ?? (!advertisingId ? payload.uid || payload.anonymous_id : undefined)

  return compact({
    timestamp: formatS2STimestamp(payload.timestamp),
    ip: payload.ip,
    lang: payload.locale,
    appsflyer_id: appsflyerId,
    inst_date: options.instDate,
    counter: options.counter,
    existing_user: options.existingUser,
    // AppsFlyer treats `aie` as an opt-out signal: only an explicit `false` disables it.
    aie: payload.ad_tracking_enabled === false ? 'false' : 'true',
    ua: payload.user_agent,
    os: payload.os_version,
    type: payload.device_model,
    uid,
    // AppsFlyer asked for Android advertising IDs to be lowercased.
    idfa: isIos ? advertisingId : undefined,
    advertising_id: isIos ? undefined : deviceType === 'android' ? advertisingId?.toLowerCase() : advertisingId,
    idfv: isIos ? resolveIdfv(advertisingId, appsflyerId, payload.device_id) : undefined,
    bundle_id: isIos ? payload.bundle_id : undefined,
    att: isIos ? resolveAtt(payload.att, payload.os_version) : undefined,
    apple_search_ads: isIos ? mapAppleSearchAds(payload.campaign) : undefined,
    cid: payload.cid,
    fb_cookie: payload.fb_cookie
  }) as S2SEventRequest
}
