// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Wingify account ID, used for fetching your Wingify async smart code.
   */
  wingifyAccountId: number
  /**
   * The maximum amount of time (in milliseconds) to wait for test settings before Wingify will simply display your original page.
   */
  settingsTolerance?: number
  /**
   * When enabled, Segment will load the Wingify SmartCode onto the webpage. When disabled, you will have to manually add SmartCode to your webpage. The setting is enabled by default, however we recommended manually adding SmartCode to the webpage to avoid flicker issues.
   */
  addSmartcode?: boolean
}
