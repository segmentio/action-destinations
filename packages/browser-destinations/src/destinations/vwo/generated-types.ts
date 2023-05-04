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
   * When enabled VWO SmartCode will load parallel to Segment Code, when disabled SmartCode has to be added manually. It is recommended to add SmartCode directly to the webpage code to avoid flicker.
   */
  addSmartcode: boolean
}
