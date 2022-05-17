// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The user specific instance URL returned by Salesforce Oauth. This setting is hidden to the user and set by Oauth Service.
   */
  instanceUrl: string
  /**
   * Enable to authenticate into a sandbox instance. You can log in to a sandbox by appending the sandbox name to your Salesforce username. For example, if a username for a production org is user@acme.com and the sandbox is named test, the username to log in to the sandbox is user@acme.com.test. If you are already authenticated, please disconnect and reconnect with your sandbox username.
   */
  isSandbox?: boolean
}
