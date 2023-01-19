// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * ID of your Microsoft Bing Ads Account. This should be a 36-characters alpha-numeric string. **Required**
   */
  client_id?: string
  /**
   * Client Secret from your Azure Portal account registered app. **Required**
   */
  client_secret?: string
  /**
   * Redirect URI for user consent (https://login.microsoftonline.com/common/oauth2/nativeclient). **Required**
   */
  redirect_uri?: string
  /**
   * Scope. **Required**
   */
  scope?: string
  /**
   * Refresh Token. **Required**
   */
  refreshToken?: string
  /**
   * Customer Account ID. **Required**
   */
  customer_account_id?: string
  /**
   * Customer ID. **Required**
   */
  customer_id?: string
  /**
   * Developer Token. **Required**
   */
  developer_token?: string
}
