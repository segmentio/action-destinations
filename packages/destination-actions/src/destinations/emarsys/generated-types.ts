// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Select which authentication method to use.
   */
  auth_type?: string
  /**
   * Your Emarsys API username. Required when using legacy authentication.
   */
  api_user?: string
  /**
   * Your Emarsys API password. Required when using legacy authentication.
   */
  api_password?: string
  /**
   * Authentication endpoint URL. Required when using new (OIDC) authentication.
   */
  apiAuthEndpoint?: string
  /**
   * The base URL for API requests. Required when using new (OIDC) authentication.
   */
  apiBaseUrl?: string
  /**
   * The ClientId for API authentication. Required when using new (OIDC) authentication.
   */
  apiClientId?: string
  /**
   * The Client Secret for API authentication. Required when using new (OIDC) authentication.
   */
  apiClientSecret?: string
}
