/** Outbound body for the v3 in-app events API. */
export interface InAppEventRequest {
  appsflyer_id: string
  eventName: string
  eventValue: string
  eventCurrency?: string
  eventTime?: string
  af_events_api: 'true'
  uid?: string
  os?: string
  ip?: string
  idfa?: string
  advertising_id?: string
  idfv?: string
  bundle_id?: string
  att?: number
  counter?: number
  referrer?: string
  consent_data?: Record<string, unknown>
}

/** A single Google Play install referrer, after key remapping. */
export interface AppsFlyerReferrer {
  source?: string
  type?: string
  referrer?: string
  click_ts?: number
  install_begin_ts?: number
  click_server_ts?: number
  install_begin_server_ts?: number
}

/** Google Play referrer as supplied by the customer, before remapping. */
export interface GooglePlayReferrer {
  source?: string
  type?: string
  install_referrer?: string
  referrer?: string
  referrer_click_timestamp_seconds?: number
  click_ts?: number
  install_begin_timestamp_seconds?: number
  install_begin_ts?: number
  referrer_click_timestamp_server_seconds?: number
  click_server_ts?: number
  install_begin_timestamp_server_seconds?: number
  install_begin_server_ts?: number
}

/** Apple Search Ads attribution, mapped to AppsFlyer's `iad-*` keys. */
export interface AppleSearchAds {
  'iad-campaign-name'?: string
  'iad-keyword'?: string
  'iad-org-name'?: string
  'iad-adgroup-name'?: string
  'iad-adgroup-id'?: string
  'iad-campaign-id'?: string
  'iad-attribution'?: string
  'iad-lineitem-id'?: string
  'iad-lineitem-name'?: string
  'iad-click-date'?: string
  'iad-conversion-date'?: string
}

/** Outbound body shared by the Application Installed and Application Opened S2S calls. */
export interface S2SEventRequest {
  timestamp: string
  ip: string
  lang: string
  appsflyer_id: string
  inst_date: string
  counter: number
  existing_user: 'true' | 'false'
  aie: 'true' | 'false'
  ua?: string
  os?: string
  type?: string
  uid?: string
  idfa?: string
  advertising_id?: string
  idfv?: string
  bundle_id?: string
  att?: number
  apple_search_ads?: AppleSearchAds
  af_deeplink?: string
  custom_data?: Record<string, unknown>
  asa_data?: string
  cid?: string
  referrers?: AppsFlyerReferrer[] | unknown
  referrer?: string
  fb_cookie?: string
}

/** Fields shared by the Application Installed and Application Opened payloads. */
export interface S2SCommonPayload {
  appsflyer_id?: string
  device_type: string
  timestamp: string | number
  ip: string
  locale: string
  advertising_id?: string
  device_id?: string
  ad_tracking_enabled?: boolean
  user_agent?: string
  os_version?: string
  device_model?: string
  bundle_id?: string
  att?: number
  uid?: string
  anonymous_id?: string
  campaign?: Record<string, unknown>
  fb_cookie?: string
  cid?: string
}
