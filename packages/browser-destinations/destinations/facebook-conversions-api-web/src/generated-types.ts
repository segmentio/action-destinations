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
   * Specify if and how Limited Data Use should apply.
   */
  ldu: string
}
