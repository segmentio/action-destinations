// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * To load the Evolv AI snippet via Segment, include your Environment API Key found in the Evolv AI Manager. This option should only be used if you are not already loading the Evolv AI snippet on your site.
   */
  environment?: string
  /**
   * When using this option, Evolv AI will levarage the Segment Anonymous ID instead of generating a new user id.
   */
  useSegmentId?: boolean
  /**
   * If you want to ignore users who take too long to apply the optimization changes, then you can use this configuration to limit how long Evolv AI should wait till the page renders.
   */
  evolvTimeout?: number
  /**
   * By default, Evolv AI stores the user id in localStorage. Since localStorage cannot be read across subdomains (e.g. domain1.example.com to domain2.example.com), you will need to specify a cookie domain (for example .example.com) in order to track users across subdomains.
   */
  useCookies?: string
  /**
   * When set, all Evolv AI confirmations for each project will be sent to Segment.
   */
  receiveConfirmations?: boolean
  /**
   * When set, only unique confirmations (once per project per session) will be sent to Segment.
   */
  receiveUniqueConfirmations?: boolean
}
