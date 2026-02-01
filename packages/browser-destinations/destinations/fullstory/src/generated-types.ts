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
   * The recording server host domain. Can be set to direct recorded events to a proxy that you host. Defaults to 'fullstory.com'.
   */
  host?: string
  /**
   * The App Host is used to define the specific base URL for the Fullstory application where session URLs are generated and displayed.
   */
  appHost?: string
  /**
   * Optionally specify a custom FullStory script URL. Useful if you are self-hosting the FullStory script or using a proxy. The detault is 'edge.fullstory.com/s/fs.js'.
   */
  script?: string
}
