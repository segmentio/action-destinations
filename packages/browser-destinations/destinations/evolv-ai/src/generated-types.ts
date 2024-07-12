// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * When an environment is provided, this integration will load the Evolv AI snippet for that environment. This should only be used if you are not already loading the evolv snippet.
   */
  environment?: string
  /**
   * When set, will use segment's anonymous id to track users instead of evolv default.
   */
  useSegmentId?: boolean
  /**
   * If you want to ignore users who take too long to apply the optimization changes then you can use this configuration to limit how long you will wait
   */
  evolvTimeout?: number
  /**
   * Evolv normally stores the user id in local storage. This cannot be read across subdomains (e.g. domain1.example.com to domain2.example.com). If your optimization is crossing subdomains set this to the domain your users will be active across (for example .example.com)
   */
  useCookies?: string
  /**
   * When set, all Evolv AI confirmations will be sent to segment
   */
  receiveConfirmations?: boolean
  /**
   * When set, only unique confirmations (each experiment per session) will be sent to segment
   */
  receiveUniqueConfirmations?: boolean
}
