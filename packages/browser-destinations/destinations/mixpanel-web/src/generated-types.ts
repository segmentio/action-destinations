// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Mixpanel project token.
   */
  projectToken: string
  /**
   * The name for the new mixpanel instance that you want created.
   */
  name?: string
  /**
   * The Mixpanel API host to send data to.
   */
  api_host: string
  /**
   * Enable or disable Mixpanel autocapture functionality. Select "Custom" to specify fine grained control over which events are autocaptured.
   */
  autocapture?: string
  /**
   * Capture pageview events automatically
   */
  pageview: string
  /**
   * Capture click events automatically
   */
  click: boolean
  /**
   * Capture dead click events automatically
   */
  dead_click: boolean
  /**
   * Capture input events automatically
   */
  input: boolean
  /**
   * Capture rage click events automatically
   */
  rage_click: boolean
  /**
   * Capture scroll events automatically
   */
  scroll: boolean
  /**
   * Capture form submit events automatically
   */
  submit?: boolean
  /**
   * Capture text content of elements in autocaptured events
   */
  capture_text_content: boolean
  /**
   * Enable or disable cross subdomain cookies for Mixpanel.
   */
  cross_subdomain_cookie?: boolean
  /**
   * Set the persistence method for Mixpanel (cookie or localStorage).
   */
  persistence?: string
  /**
   * Enable or disable tracking of marketing campaigns in Mixpanel. Includes UTM parameters and click identifiers for various ad platforms.
   */
  track_marketing?: boolean
  /**
   * Set the cookie expiration time in days for Mixpanel cookies.
   */
  cookie_expiration?: number
  /**
   * Disable all persistence mechanisms for Mixpanel.
   */
  disable_persistence?: boolean
  /**
   * Enable or disable sending IP address information to Mixpanel.
   */
  ip?: boolean
  /**
   * CSS class to block elements from being recorded in session recordings.
   */
  record_block_class?: string
  /**
   * CSS selector to block elements from being recorded in session recordings.
   */
  record_block_selector?: string
  /**
   * Enable or disable recording of canvas elements in session recordings.
   */
  record_canvas?: boolean
  /**
   * Enable or disable tracking of heatmap events in session recordings.
   */
  record_heatmap_data?: boolean
  /**
   * Idle timeout in milliseconds for session recordings.
   */
  record_idle_timeout_ms?: number
  /**
   * CSS class to mask text elements in session recordings.
   */
  record_mask_text_class?: string
  /**
   * CSS selector to mask text elements in session recordings.
   */
  record_mask_text_selector?: string
  /**
   * Maximum recording time in milliseconds for session recordings.
   */
  record_max_ms?: number
  /**
   * Minimum recording time in milliseconds for session recordings.
   */
  record_min_ms?: number
  /**
   * Percentage of sessions to record for session recordings.
   */
  record_sessions_percent?: number
}
