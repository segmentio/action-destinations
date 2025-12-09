// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The organization ID for FullStory.
   */
  orgId: string
  /**
   * Enables FullStory debug mode.
   */
  debug?: boolean
  /**
   * Enables FullStory inside an iframe.
   */
  recordOnlyThisIFrame?: boolean
  /**
   * The recording server host domain. Can be set to direct recorded events to a proxy that you host. Defaults to `fullstory.com`.
   */
  host?: string
  /**
   * Use this to set the app host for displaying session urls. If using a version of [Fullstory Relay](https://help.fullstory.com/hc/en-us/articles/360046112593-How-to-send-captured-traffic-to-your-First-Party-Domain-using-Fullstory-Relay), you may need to set appHost "app.fullstory.com" or "app.eu1.fullstory.com" depending on your region.
   */
  appHost?: string
}
