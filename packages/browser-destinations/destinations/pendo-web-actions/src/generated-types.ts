// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Pendo API Key
   */
  apiKey: string
  /**
   * The region for your Pendo subscription.
   */
  region: string
  /**
   * If you are using Pendo's CNAME feature, this will update your Pendo install snippet with your content host.
   */
  cnameContentHost?: string
  /**
   * Override sending Segment's user traits on load. This will prevent Pendo from initializing with the user traits from Segment (analytics.user().traits()). Allowing you to adjust the mapping of visitor metadata in Segment's identify event.
   */
  disableUserTraitsOnLoad?: boolean
  /**
   * Override sending Segment's group id for Pendo's account id. This will prevent Pendo from initializing with the group id from Segment (analytics.group().id()). Allowing you to adjust the mapping of account id in Segment's group event.
   */
  disableGroupIdAndTraitsOnLoad?: boolean
}
