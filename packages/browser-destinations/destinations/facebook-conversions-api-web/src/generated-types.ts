// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The Pixel ID associated with your Facebook Pixel.
   */
  pixelId: string
  /**
   * If set to true, prevents Facebook Pixel from sending PageView events on history state changes. Set to true if you want to trigger PageView events manually via the pageView Action.
   */
  disablePushState?: boolean
  /**
   * Control whether Facebook’s Meta Pixel automatically collects additional page and button data to optimize ads and measurement. When this toggle is on, Auto Config is disabled and only basic pixel tracking will occur. Turning it off enables Auto Config, allowing the Pixel to automatically send page metadata and button interactions to improve ad delivery and reporting.
   */
  disableAutoConfig?: boolean
  /**
   * Control whether Facebook’s Meta Pixel uses first-party cookies. When this toggle is on, first-party cookies are disabled, enhancing user privacy. Turning it off enables the use of first-party cookies for more accurate tracking.
   */
  disableFirstPartyCookies?: boolean
  /**
   * Specifies the agent to use when sending events.
   */
  agent?: string
  /**
   * Specify if and how Limited Data Use should apply.
   */
  ldu: string
  /**
   * If enabled, uses Facebook’s Parameter Builder library to help ensure that User Data values are properly formatted before being sent to Facebook.
   */
  formatUserDataWithParamBuilder?: boolean
}
