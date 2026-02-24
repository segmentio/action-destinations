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
   * The domain of the web capture server host. Can be set to direct captured events to a [Fullstory Custom Endpoint](https://help.fullstory.com/hc/en-us/articles/18612999473175-How-to-send-captured-traffic-to-your-First-Party-Domain-using-Custom-Endpoints) or a proxy that you host. Defaults to 'fullstory.com'.
   */
  host?: string
  /**
   * The App Host is used to define the specific base URL for the Fullstory application where session URLs are generated and displayed. Leave blank if using the default value for "Host"
   */
  appHost?: string
  /**
   * Optionally specify a custom FullStory script URL. Useful if you are using a proxy. The default is 'edge.fullstory.com/s/fs.js'.
   */
  script?: string
}
