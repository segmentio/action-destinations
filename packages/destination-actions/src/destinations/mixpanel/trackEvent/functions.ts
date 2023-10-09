import { omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import { MixpanelEventProperties } from '../mixpanel-types'
import { getBrowser, getBrowserVersion, cheapGuid } from '../common/utils'

const mixpanelReservedProperties = ['time', 'id', '$anon_id', 'distinct_id', '$group_id', '$insert_id', '$user_id']

export function getEventProperties(payload: Payload, settings: Settings): MixpanelEventProperties {
  const datetime = payload.time
  const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()
  const utm = payload.utm_properties || {}
  let browser, browserVersion
  if (payload.userAgent) {
    browser = getBrowser(payload.userAgent)
    browserVersion = getBrowserVersion(payload.userAgent)
  }
  const integration = payload.context?.integration as Record<string, string>
  return {
    time: time,
    ip: payload.ip,
    id: payload.distinct_id,
    $anon_id: payload.anonymous_id,
    distinct_id: payload.distinct_id,
    $app_build_number: payload.app_build,
    $app_version_string: payload.app_version,
    $app_namespace: payload.app_namespace,
    $app_name: payload.app_name,
    $browser: browser,
    $browser_version: browserVersion,
    $bluetooth_enabled: payload.bluetooth,
    $cellular_enabled: payload.cellular,
    $carrier: payload.carrier,
    $current_url: payload.url,
    $device: payload.device_name,
    $device_id: payload.anonymous_id,
    $device_type: payload.device_type,
    $device_name: payload.device_name,
    $group_id: payload.group_id,
    $identified_id: payload.user_id,
    $insert_id: payload.insert_id ?? cheapGuid(),
    $ios_ifa: payload.idfa,
    $lib_version: payload.library_version,
    $locale: payload.language,
    $manufacturer: payload.device_manufacturer,
    $model: payload.device_model,
    $os: payload.os_name,
    $os_version: payload.os_version,
    $referrer: payload.referrer,
    $screen_height: payload.screen_height,
    $screen_width: payload.screen_width,
    $screen_density: payload.screen_density,
    $source: integration?.name == 'Iterable' ? 'Iterable' : 'segment',
    $user_id: payload.user_id,
    $wifi_enabled: payload.wifi,
    mp_country_code: payload.country,
    mp_lib: payload.library_name && `Segment Actions: ${payload.library_name}`,
    segment_source_name: settings.sourceName,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_medium: utm.utm_medium,
    utm_source: utm.utm_source,
    utm_term: utm.utm_term,
    advertising_id: payload.advertising_id,
    ad_tracking_enabled: payload.ad_tracking_enabled,
    timezone: payload.timezone,
    app_platform: payload.app_platform,
    event_original_name: payload.name,
    $mobile: payload.userAgentData?.mobile,
    $platform: payload.userAgentData?.platform,
    $bitness: payload.userAgentData?.bitness,
    $platformVersion: payload.userAgentData?.platformVersion,
    $uaFullVersion: payload.userAgentData?.uaFullVersion,
    $wow64: payload.userAgentData?.wow64,
    // Ignore Mixpanel reserved properties
    ...omit(payload.event_properties, mixpanelReservedProperties)
  }
}
