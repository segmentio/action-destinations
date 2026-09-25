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
   * Your Salesforce Marketing Cloud client secret from Setup > Installed Packages. Secrets expire every 180 days (pre-March 25, 2026 secrets expire Sept 30, 2026), which will stop event delivery. To rotate seamlessly, paste a staged secret here, wait at least 1 hour to verify successful delivery, then activate it in SFMC. See [Rotate an OAuth 2.0 Client Secret](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/rotate-oauth2-secret.html).
   */
  client_secret: string
}
