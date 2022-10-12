
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import { MixpanelEventProperties } from '../mixpanel-types'
import { getBrowser, getBrowserVersion, cheapGuid } from '../utils'

export function getEventProperties(payload: Payload, settings: Settings): MixpanelEventProperties {
    const datetime = payload.time
    const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

    const utm = payload.utm_properties || {}
    let browser, browserVersion
    if (payload.userAgent) {
        browser = getBrowser(payload.userAgent, payload.device_manufacturer)
        browserVersion = getBrowserVersion(payload.userAgent, payload.device_manufacturer)
    }
    return {
        time: time,
        ip: payload.ip,
        id: payload.distinct_id,
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
        $device_id: payload.device_id,
        $device_type: payload.device_type,
        $device_name: payload.device_name,
        $group_id: payload.group_id,
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
        $source: 'segment',
        $wifi_enabled: payload.wifi,
        mp_country_code: payload.country,
        mp_lib: payload.library_name && `Segment: ${ payload.library_name }`,
        segment_source_name: settings.sourceName,
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content,
        utm_medium: utm.utm_medium,
        utm_source: utm.utm_source,
        utm_term: utm.utm_term,
        ...payload.event_properties
    }
}