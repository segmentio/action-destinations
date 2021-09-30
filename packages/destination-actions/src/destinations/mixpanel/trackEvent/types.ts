export type MixpanelEvent = {
  event: string
  properties: {
    // id?: string // 'test_segment_user'
    $app_build_number?: string // '3.0.1.545'
    $app_version_string?: string // '545'
    $app_namespace?: string // 'com.test.mixpanel'
    $app_name?: string // 'Mixpanel'
    $bluetooth_enabled?: boolean
    $browser_version?: string // '9.0'
    $browser?: string // 'Mobile Safari'
    $carrier?: string // 'T-Mobile US'
    $cellular_enabled?: boolean
    $current_url?: string // 'https?://segment.com/academy/'
    $device?: string // 'maguro'
    $device_id?: string
    $device_type?: string // 'ios'
    $device_name?: string // 'maguro'
    $insert_id?: string // '859d3955-363f-590a-9aa4-b4f49b582437'
    $ios_app_release?: string // '3.0.1.545'
    $ios_app_version?: string // '545'
    $ios_device_model?: string // 'iPhone7,2'
    $ios_ifa?: string // '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB'
    $ios_version?: string // '8.1.3'
    $ip?: string
    $lib_version?: string
    $locale?: string
    $manufacturer?: string // 'Apple'
    $model?: string // 'iPhone7,2'
    $mp_api_endpoint?: string // 'api.mixpanel.com'
    $os_version?: string // '8.1.3'
    $os?: string // 'iPhone OS'
    $screen_density?: number
    $screen_height?: number
    $screen_width?: number
    $source?: 'segment'
    $wifi_enabled?: boolean
    distinct_id?: string | null // 'test_segment_user'
    id?: string | null // this is just to maintain backwards compatibility  with the classic segment integration, I'm not completely sure what the purpose of this was.
    mp_country_code?: string // 'US'
    mp_lib?: 'segment' // 'Segment?: analytics.js'
    segment_source_name?: string // 'readme'
    time?: number
    utm_campaign?: string // 'TPS Innovation Newsletter'
    utm_content?: string // 'image link'
    utm_medium?: string // 'email'
    utm_source?: string // 'Newsletter'
    utm_term?: string // 'tps reports'
  }
}
