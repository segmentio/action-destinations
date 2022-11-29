// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The Pardot Business Unit ID associated with your Pardot Account. To find your Business Unit ID in Salesforce, go to **Setup** and search for `Pardot`. Your Pardot Business Unit ID is an 18-character string that starts with `0Uv`.  If you cannot access the Pardot Account Setup information, ask your Salesforce Administrator to find the Pardot Business Unit ID for you.
   */
  businessUnitID: string
  /**
   * You can find your Account ID (`piAId`) under **Marketing > Campaigns** in your [Pardot account](https://pi.pardot.com/campaign). After selecting your desired website campaign, press **View Tracking Code**.
   */
  accountID: string
  /**
   * Enable to authenticate into a sandbox instance. You can log in to a sandbox by appending the sandbox name to your Salesforce username. For example, if a username for a production org is user@acme.com and the sandbox is named `test`, the username to log in to the sandbox is user@acme.com.test. If you are already authenticated, please disconnect and reconnect with your sandbox username.
   */
  isSandbox?: boolean
}
