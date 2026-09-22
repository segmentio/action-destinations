// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The unique subdomain Salesforce Marketing Cloud assigned to your account. Subdomains are tenant specific and should be a 28-character string starting with the letters "mc". Do not include the .rest.marketingcloudapis.com part of your subdomain URL. See more information on how to find your subdomain [here](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/your-subdomain-tenant-specific-endpoints.html).
   */
  subdomain: string
  /**
   * Your Salesforce Marketing Cloud account identifier (or MID). See more information on how to find your MID [here](https://help.salesforce.com/s/articleView?id=sf.mc_overview_determine_your_marketing_cloud_instance.htm&type=5).
   */
  account_id: string
  /**
   * Your Salesforce Marketing Cloud client ID. The client ID is issued when you create an API integration in [Installed Packages](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/install-packages.html).
   */
  client_id: string
  /**
   * Your Salesforce Marketing Cloud client secret. The client secret is issued when you create an API integration in Installed Packages. Client secrets expire 180 days after they are generated, and separately, as a one-time migration deadline, secrets created before 25 March 2026 expire on 30 September 2026 regardless of when they were generated. When a secret expires Segment can no longer authenticate and event delivery to this destination fails. To rotate without downtime, generate a staged secret in Marketing Cloud Setup > Installed Packages and paste it here before activating it in Marketing Cloud: Marketing Cloud accepts the staged and the active secret at the same time, and activating invalidates the old secret immediately. Segment starts using the new secret the next time it requests an access token; because it reuses a cached access token until then, delivery staying healthy right after you save does not confirm the secret was entered correctly, so check the pasted value rather than relying on delivery status. See [Rotate an OAuth 2.0 Client Secret](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/rotate-oauth2-secret.html).
   */
  client_secret: string
}
