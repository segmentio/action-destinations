// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Emarsys API username. Set this together with API password to use legacy X-WSSE authentication against the v2 API.
   */
  api_user?: string
  /**
   * Your Emarsys API password. Set this together with API username to use legacy X-WSSE authentication against the v2 API.
   */
  api_password?: string
  /**
   * Authentication endpoint URL. Required when not using legacy API username/password.
   */
  apiAuthEndpoint?: string
  /**
   * The base URL for API requests. Required when not using legacy API username/password.
   */
  apiBaseUrl?: string
  /**
   * The ClientId for API authentication. Required when not using legacy API username/password.
   */
  apiClientId?: string
  /**
   * The Client Secret for API authentication. Required when not using legacy API username/password.
   */
  apiClientSecret?: string
}
