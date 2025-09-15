// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your VWO account ID, used for fetching your VWO async smart code.
   */
  vwoAccountId: number
  /**
   * The maximum amount of time (in milliseconds) to wait for test settings before VWO will simply display your original page.
   */
  settingsTolerance?: number
  /**
   * The maximum amount of time (in milliseconds) to wait for VWO’s full library to be downloaded before simply displaying your original page.
   */
  libraryTolerance?: number
  /**
   * If your page already includes JQuery, you can set this to “true”. Otherwise, VWO will include JQuery onto the page for you. VWO needs JQuery on the page to function correctly.
   */
  useExistingJquery?: boolean
  /**
   * When enabled, Segment will load the VWO SmartCode onto the webpage. When disabled, you will have to manually add SmartCode to your webpage. The setting is enabled by default, however we recommended manually adding SmartCode to the webpage to avoid flicker issues.
   */
  addSmartcode?: boolean
}
