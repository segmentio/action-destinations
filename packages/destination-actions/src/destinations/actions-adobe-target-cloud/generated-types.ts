// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * To establish a secure service-to-service Adobe I/O API session, you must create a JSON Web Token (JWT) that encapsulates the identity of your integration, and then exchange it for an access token
   */
  jwt_token: string
  /**
   * Adobe.io Client ID
   */
  client_id: string
  /**
   * Adobe.io Client Secret
   */
  client_secret: string
  /**
   * The tenantId is your Adobe Experience Cloud tenant ID. It is present as a subdomain of your Experience Cloud URL. For example, if your Experience Cloud URL is piedpiper.experiencecloud.adobe.com or piedpiper.marketing.adobe.com, the tenant ID is piedpiper.
   */
  tenant_id: string
  /**
   * This value is the result of the JWT Auth Flow. The setting will be removed once the new flow is supported by the framework.
   */
  auth_token: string
}
