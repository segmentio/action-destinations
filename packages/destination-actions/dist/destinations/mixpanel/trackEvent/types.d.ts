export declare type MixpanelEvent = {
  event: string
  properties: {
    $app_build_number?: string
    $app_version_string?: string
    $app_namespace?: string
    $app_name?: string
    $bluetooth_enabled?: boolean
    $browser_version?: string
    $browser?: string
    $carrier?: string
    $cellular_enabled?: boolean
    $current_url?: string
    $device?: string
    $device_id?: string
    $device_type?: string
    $device_name?: string
    $group_id?: string
    $insert_id?: string
    $ios_app_release?: string
    $ios_app_version?: string
    $ios_device_model?: string
    $ios_ifa?: string
    $ios_version?: string
    ip?: string
    $lib_version?: string
    $locale?: string
    $manufacturer?: string
    $model?: string
    $mp_api_endpoint?: string
    $os_version?: string
    $os?: string
    $referrer?: string
    $screen_density?: number
    $screen_height?: number
    $screen_width?: number
    $wifi_enabled?: boolean
    $source: 'segment'
    distinct_id?: string | null
    id?: string | null
    mp_country_code?: string
    mp_lib?: string
    segment_source_name?: string
    time?: number
    utm_campaign?: string
    utm_content?: string
    utm_medium?: string
    utm_source?: string
    utm_term?: string
  }
}
