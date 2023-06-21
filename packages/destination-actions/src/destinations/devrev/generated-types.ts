// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your DevRev API Key, generated from the setting page in your DevRev organization.
   */
  apiKey: string
  /**
   * A comma separated list of email domains to blacklist from being used to search for/create Accounts.
   */
  blacklistedDomains?: string
  /**
   * The DevRev API endpoint to use.  No need to change unless you have a custom endpoint
   */
  devrevApiEndpoint: string
}
