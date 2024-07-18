// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your service user Access Key Id. You can generate the service user and its Access Key Id in your m3ter console under "Settings" -> "Access" -> "Service Users" -> "Create Service User". Step by step guide can be found in [m3ter Docs](https://www.m3ter.com/docs/guides/authenticating-with-the-platform/service-authentication#generating-an-api-key-and-secret-for-a-service-user)
   */
  access_key_id: string
  /**
   * Your service user Api Secret. You can generate the service user and its Api Secret in your m3ter console under "Settings" -> "Access" -> "Service Users" -> "Create Service User". Step by step guide can be found in [m3ter Docs](https://www.m3ter.com/docs/guides/authenticating-with-the-platform/service-authentication#generating-an-api-key-and-secret-for-a-service-user)
   */
  api_secret: string
  /**
   * ID of your organization where your data will be submitted to
   */
  org_id: string
}
