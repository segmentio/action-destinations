// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Found in your project settings, under "Project API key"
   */
  api_key: string
  /**
   * Found in your project settings, under "Project ID"
   */
  project_id: string
  /**
   * API Endpoint URL based on project region
   */
  endpoint: string
  /**
   * If enabled, this ensures that events are processed in order without triggering our spike detection systems. Affects events sent via the track Action only.
   */
  historical_migration?: boolean
  /**
   * If enabled, [GeoIP collection](https://github.com/PostHog/posthog-plugin-geoip) will be disabled. This will prevent the collection of IP addresses and other geolocation data.
   */
  geoip_disable?: boolean
}
